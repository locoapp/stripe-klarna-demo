import { useState } from 'react';
import { Image, StyleSheet, Platform, Button, ActivityIndicator } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { confirmPayment, initStripe } from '@stripe/stripe-react-native';

type State =
  | { kind: 'landing' }
  | { kind: 'loading' }
  | { kind: 'error', message: string }
  | { kind: 'stripe' }
  | { kind: 'payment-intent', clientSecret: string }
  | { kind: 'success', message: string }

export default function HomeScreen() {
  const [state, setState] = useState<State>({ kind: 'landing' })

  const handleInitiateStripeLibrary = async () => {
    try {
      setState({ kind: 'loading' })

      const response = await fetch(`https://rigorous-heartbreaking-cephalopod.glitch.me/stripe-key?paymentMethod=undefined`)

      const { publishableKey, error } = await response.json()

      if (error) {
        setState({ kind: 'error', message: JSON.stringify(error) })
        return
      }

      await initStripe({
        publishableKey,
        merchantIdentifier: 'merchant.com.stripe.react.native',
        urlScheme: 'stripe-klarna-demo',
        setReturnUrlSchemeOnAndroid: true,
      })

      setState({ kind: 'stripe' })
    } catch (error: any) {
      setState({ kind: 'error', message: error?.message ?? String(error) })
    }
  }

  const handleInitiatePaymentIntent = async () => {
    try {
      setState({ kind: 'loading' })

      const response = await fetch(`https://rigorous-heartbreaking-cephalopod.glitch.me/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'customer@email.se',
          currency: 'usd',
          items: ['id-1'],
          payment_method_types: ['klarna'],
        }),
      })

      const { clientSecret, error } = await response.json()

      if (error) {
        setState({ kind: 'error', message: JSON.stringify(error) })
        return
      }

      setState({ kind: 'payment-intent', clientSecret })
    } catch (error: any) {
      setState({ kind: 'error', message: error?.message ?? String(error) })
    }
  }

  const handleConfirmPaymentIntent = async () => {
    if (state.kind !== 'payment-intent') {
      setState({ kind: 'error', message: 'Invalid state' })
      return
    }

    try {
      setState({ kind: 'loading' })

      const { error, paymentIntent } = await confirmPayment(state.clientSecret, {
        paymentMethodType: 'Klarna',
        paymentMethodData: {
          shippingDetails: {
            address: {
              city: 'Houston',
              country: 'US',
              line1: '1459  Circle Drive',
              state: 'Texas',
              postalCode: '77063',
            },
            email: 'myemail@s.com',
            name: 'John Doe',
          },
          billingDetails: {
            address: { country: 'US' },
            email: 'customer@email.us'
          }
        }
      })

      if (error) {
        setState({ kind: 'error', message: error.message })
        return
      }

      setState({ kind: 'success', message: JSON.stringify(paymentIntent, null, 2) })
    } catch (error: any) {
      setState({ kind: 'error', message: error?.message ?? String(error) })
    }
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      {state.kind !== 'loading' ? null : (
        <ActivityIndicator size="large" color="#0000ff" />
      )}

      {state.kind !== 'error' ? null : (
        <ThemedView>
          <ThemedText>Error: {state.message}</ThemedText>
        </ThemedView>
      )}

      {state.kind !== 'landing' ? null : (
        <ThemedView>
          <ThemedText>
            Click the button below to initiate the Stripe SDK.
          </ThemedText>

          <Button
            title="Initiate Stripe SDK"
            onPress={handleInitiateStripeLibrary}
          />
        </ThemedView>
      )}

      {state.kind !== 'stripe' ? null : (
        <ThemedView>
          <ThemedText>
            Click the button below to initiate the payment intent.
          </ThemedText>

          <Button
            title="Initiate Payment Intent"
            onPress={handleInitiatePaymentIntent}
          />
        </ThemedView>
      )}

      {state.kind !== 'payment-intent' ? null : (
        <ThemedView>
          <ThemedText>
            Payment intent initiated with client secret: {state.clientSecret}
          </ThemedText>

          <ThemedText>
            Press the button below to confirm the payment.
          </ThemedText>

          <Button
            title="Confirm Payment Intent"
            onPress={handleConfirmPaymentIntent}
          />
        </ThemedView>
      )}

      {state.kind !== 'success' ? null : (
        <ThemedView>
          <ThemedText>Payment successful!</ThemedText>
          <ThemedText>{state.message}</ThemedText>
        </ThemedView>
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
