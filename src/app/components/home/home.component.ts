import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlanType } from 'src/app/model/plan-type.model';
import { ApiService } from 'src/app/services/api.service';

import { StripeService } from "ngx-stripe";
import {
  StripeElements,
  StripeCardElement,
  StripeCardElementOptions,
  StripeElementsOptions,
  StripePaymentElement,
  StripePaymentElementChangeEvent
} from '@stripe/stripe-js';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';


enum CurrentView { plan, register, subscribe };

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  elements?: StripeElements;
  paymentElement?: StripePaymentElement;

  elementsOptions: StripeElementsOptions = {
    locale: 'en',
    appearance: { theme: 'stripe' },
  };

  // cardOptions: StripeCardElementOptions = {
  //   style: {
  //     base: {
  //       iconColor: 'Blue',
  //       color: 'Blue',
  //       fontWeight: '300',
  //       fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
  //       fontSize: '18px',
  //       '::placeholder': {
  //         color: 'Blue'
  //       }
  //     }
  //   }
  // };

  CView = CurrentView;

  currentView: CurrentView = CurrentView.plan;

  registerForm?: FormGroup;

  // showRegisterField: boolean = false;
  // showCardField: boolean = false;

  selectedPlanType?: string;
  Plan = PlanType;


  //paymentStatus?: string;

  //isPaymentCancelled: boolean = false;
  //shouldShowPaymentStatusMessage = false;

  isSubscribing: boolean = false;

  isPaymentDetailsComplete: boolean = false;

  isPaymentInProgress: boolean = false;

  isMsgView: boolean = false;

  name?: string;

  constructor(private apiService: ApiService, private router: Router, private activatedRoute: ActivatedRoute, private fb: FormBuilder, private stripeService: StripeService) {

  }

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe({
      next: (params: any) => {
        this.isMsgView = params['view'] === 'msg';
        console.log(params);
        if (this.isMsgView) {
          const paymentIntentIdentifier = params['payment_intent'];
          const paymentIntentClientSecret = params['payment_intent_client_secret'];
          if (paymentIntentIdentifier && paymentIntentClientSecret) {
            console.log('payment element Identifier: ', paymentIntentIdentifier);
            this.getPaymentIntent(paymentIntentClientSecret);
          } else {
            alert('Your payment did not complete successfully. Please try again. make sure you enter the valid card details');
            this.reInitiatePayment();
          }
        }
      }
    });

    this.registerForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required]]
    });

  }

  selectPlan(planType: string) {
    this.currentView = this.CView.register;
    //this.mountTheCard();
    this.selectedPlanType = planType;
    console.log(this.selectedPlanType.toString());
  }

  registerAndSubscribe() {
    if (this.registerForm?.valid) {
      const name = this.registerForm!.get('name')!.value;
      this.name = name;
      const email = this.registerForm!.get('email')!.value;
      this.apiService.createCustomer(email, name).subscribe({
        next: (res: any) => {
          console.log('user created successfully');
          console.log(res);
          localStorage.setItem('customerId', res.customer.id);

          this.apiService.createSubscription(res.customer.id, this.selectedPlanType!).subscribe({
            next: (res: any) => {
              console.log('subscription creating success ', res);

              localStorage.setItem('subscriptionId', res.subscriptionId);

              this.saveClientSecretInLocalStorage(res.clientSecret);

              this.createPaymentElement(res.clientSecret);
              //this.completePaymentWithCardDetails(res.clientSecret);
            }
          })
        },
        error: err => {
          console.log('Error occured whille creating the user ', err);
          alert('could not register the customer');
        }
      });
    }
  }

  createPaymentElement(clientSecret: string) {
    console.log('Client Secret ', clientSecret);
    this.stripeService.elements({
      clientSecret: clientSecret,
      locale: 'en',
      appearance: { theme: 'stripe' },
    }).subscribe(
      elements => {
        this.elements = elements;
        if (!this.paymentElement) {
          this.paymentElement = this.elements!.create('payment');
          this.paymentElement.mount('#payment-element');
          this.addOnChangeListenerToPlaymentElement();
        }
      }
    );
  }

  addOnChangeListenerToPlaymentElement() {
    this.paymentElement?.on("change", (event: StripePaymentElementChangeEvent) => {
      if (event.complete) {
        this.isPaymentDetailsComplete = true;
      }
      if (this.currentView != CurrentView.subscribe && !event.collapsed) {
        this.currentView = CurrentView.subscribe
      }
    });
  }

  confirmPayment() {
    this.isPaymentInProgress = true;
    this.stripeService.confirmPayment({
      elements: this.elements!,
      confirmParams: {
        return_url: "http://localhost:4200/home?view=msg",
        // payment_method_data: {
        //   billing_details: {
        //     name: this.name
        //   }
        // }
      }
    }).subscribe({
      next: res => {
        console.log('Confirm Payment res ', res);
        if (res.error) {
          this.isPaymentInProgress = false;
          alert(res.error.message + " Please try again");
          this.paymentElement?.clear();
        }
      },
      error: err => {
        console.log('error :', err);
        this.isPaymentInProgress = false;
        alert(err.message + " Please try again");
        this.paymentElement?.clear();
      },
      complete: () => {
        //this.isPaymentInProgress = false;
      }
    });
  }

  reInitiatePayment() {
    this.isMsgView = false;
    const clientSecret = this.getClientSecretFromLocalStorage();
    if (clientSecret) {
      this.createPaymentElement(clientSecret);
    } else {
      alert('Client secret not found. could not reinitiate payment');
    }
  }

  getPaymentIntent(paymentIntentClientSecret: string) {
    this.stripeService.retrievePaymentIntent(paymentIntentClientSecret).subscribe({
      next: ({ paymentIntent }) => {
        console.log('Payment intent ', paymentIntent);
        if (paymentIntent) {
          switch (paymentIntent.status) {
            case 'succeeded':
              alert('Success payment received');

              localStorage.removeItem('clientSecret');

              this.router.navigate(['/customer-dashboard']);
              break;

            case 'processing':
              alert("Payment processing. We'll update you when payment is received.");
              break;

            case 'requires_payment_method':
              alert('Payment failed. Please try another payment method.');

              this.reInitiatePayment();

              break;

            default:
              alert('Something went wrong.');
              break;
          }
        } else {
          alert('Could not get the payment Intent');
        }
      }
    })
  }

  getClientSecretFromLocalStorage = () => localStorage.getItem('clientSecret') || undefined;

  saveClientSecretInLocalStorage(clientSecret: string) {
    localStorage.setItem('clientSecret', clientSecret);
  }
}

  // checkout() {
  //   console.log(this.email);
  //   if (this.selectedPlanType) {
  //     this.apiService.register(this.email).subscribe({
  //       next: res => {

  //       },
  //       error: err => {
  //         alert('could not register the customer');
  //       }
  //     });
  //     //this.apiService.checkout(this.selectedPlanType, this.email);
  //   }
  // }

  // createToken() {
  //   const name = this.registerForm!.get('name')!.value;
  //   this.stripeService
  //     .createToken(this.card!, { name })
  //     .subscribe((result) => {
  //       if (result.token) {
  //         // Use the token
  //         console.log(result.token.id);
  //       } else if (result.error) {
  //         // Error creating the token
  //         console.log(result.error.message);
  //       }
  //     });
  // }

//}


// mountTheCard() {
  //   this.stripeService.elements(this.elementsOptions)
  //     .subscribe(elements => {
  //       this.elements = elements;
  //       // Only mount the element the first time
  //       if (!this.card) {
  //         this.card = this.elements.create('card', this.cardOptions);
  //         this.card.mount('#card-element');
  //       }
  //     });
  // }

  // register() {
  //   if (!this.selectedPlanType || !this.email) return;
  //   this.apiService.register(this.email).subscribe({
  //     next: res => {
  //       this.stripeService.elements(this.elementsOptions)
  //         .subscribe(elements => {
  //           this.elements = elements;
  //           // Only mount the element the first time
  //           if (!this.card) {
  //             this.card = this.elements.create('card', this.cardOptions);
  //             this.card.mount('#card-element');
  //           }
  //         });
  //     },
  //     error: err => {
  //       alert('An error occurred while registering the user');
  //     }
  //   })
  // }


  // completePaymentWithCardDetails(clientSecret: string) {
  //   const name = this.registerForm!.get('name')!.value;
  //   this.stripeService.confirmCardPayment(clientSecret, {
  //     payment_method: {
  //       card: this.card!,
  //       billing_details: {
  //         name: name,
  //       }
  //     }, receipt_email: 'niteesh.mahato@intelliticks.com'
  //   }).subscribe({
  //     next: (res: any) => {
  //       console.log('Subscription successful ', res);
  //       alert('You have be successfully subscribed');
  //       this.router.navigate(['/customer-dashboard']);
  //     },
  //     error: err => {
  //       console.log('An error occured while confirming payment ', err);
  //     }
  //   })