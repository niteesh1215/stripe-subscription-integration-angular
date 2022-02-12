import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PlanType } from '../model/plan-type.model';
import { switchMap } from 'rxjs/operators';
import { StripeService } from 'ngx-stripe';


@Injectable({
  providedIn: 'root'
})
export class ApiService {

  url: string = 'http://localhost:4242';

  constructor(private https: HttpClient, private stripeService: StripeService) { }

  createCustomer(email: string, name: string) {
    return this.https.post(this.url + '/create-customer', { email, name })
  }

  createSubscription(customerId: string, plan: string) {
    return this.https.post(this.url + '/create-subscription', { customerId, plan });
  }

  updateSubscription(sId: string, currentPlan: string, newPlan: string) {
    return this.https.post(this.url + '/update-subscription', { sId, currentPlan, newPlan });
  }

  getSubscriptionDetails(subscriptionId: string) {
    return this.https.get(this.url + '/get-subscription?sId=' + subscriptionId);
  }

  getUpcomingInvoices(subscriptionId: string, customerId: string, plan: string) {
    return this.https.post(this.url + '/invoice-preview', { customerId, subscriptionId, plan })
  }

  deleteSubscription(subscriptionId: string) {
    return this.https.delete(this.url + '/del-subscription?sId=' + subscriptionId);
  }

  // checkout(plan: string, customerId: string) {
  //   console.log('plan: ' + plan, ' customer id: ', customerId)

  //   this.https.post(this.url + '/create-checkout-session', { plan, customerId })
  //     .pipe(
  //       switchMap((res: any) => {
  //         console.log('session id ', res.id);
  //         console.log('customer id ', res.customer_id);
  //         localStorage.setItem('customer_id', res.customer.id);
  //         return this.stripeService.redirectToCheckout({ sessionId: res.id })
  //       })
  //     )
  //     .subscribe({
  //       next: result => {
  //         // If `redirectToCheckout` fails due to a browser or network
  //         // error, you should display the localized error message to your
  //         // customer using `error.message`.
  //         console.log('result ', result);
  //         if (result.error) {
  //           alert(result.error.message);
  //         }
  //       }, error: err => {
  //         console.log(err);
  //       }
  //     });
  // }

}




