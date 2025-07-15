import Stripe from 'stripe';

let stripe;

export const initStripe = () => {
    if (!stripe) {
        console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'Set' : 'Not set');
        if (!process.env.STRIPE_SECRET_KEY) {
            console.error('Stripe secret key is missing from environment variables');
            return null;
        }
        stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    }
    return stripe;
};

export { stripe };