declare module '@paystack/inline-js' {
  export default class PaystackPop {
    constructor();
    resumeTransaction(accessCode: string): void;
  }
}

