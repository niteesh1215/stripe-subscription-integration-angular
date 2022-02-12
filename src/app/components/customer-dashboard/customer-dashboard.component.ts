import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-customer-dashboard',
  templateUrl: './customer-dashboard.component.html',
  styleUrls: ['./customer-dashboard.component.css']
})
export class CustomerDashboardComponent implements OnInit {

  customerId: string = 'loading...'
  subscriptionId: string = 'loading...';
  subscriptionDetails: any = 'loading..';
  delSubsDetails?: string;
  plan: string = 'loading...';
  newPlan: string = '';
  invoice?: string;

  shouldShowPlanPicker: boolean = false;

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.customerId = localStorage.getItem('customerId') || 'not found';
    this.subscriptionId = localStorage.getItem('subscriptionId') || 'not found';
    this.getSubscription();

  }

  selectNewPlan(newPlan: string) {
    this.newPlan = newPlan;
    this.shouldShowPlanPicker = false;
    this.upgradeSubscription();
  }

  upgradeSubscription() {
    if (!this.newPlan) return;
    this.apiService.updateSubscription(this.subscriptionId, this.plan, this.newPlan).subscribe({
      next: res => {
        console.log('upgraded subscriptions', res);
        this.getSubscription();
      },
      error: err => {
        console.log('An error occurred ', err);
      }
    });
  }

  getSubscription() {
    this.apiService.getSubscriptionDetails(this.subscriptionId).subscribe({
      next: (sDetatils: any) => {
        this.subscriptionDetails = sDetatils.subscription;
        this.plan = sDetatils.plan;
      },
      error: err => {
        this.plan = 'not found';
        console.log(err);
        this.subscriptionDetails = ' An error occurred';
      }
    });
  }

  retrieveUpcomingInvoice() {
    this.apiService.getUpcomingInvoices(this.subscriptionId, this.customerId, this.plan).subscribe({
      next: (res: any) => {
        this.invoice = res;
      },
      error: err => {
        console.log(err);
        alert('An error occurred while getting the invoice');
      }
    })
  }

  cancelSubscription() {
    this.apiService.deleteSubscription(this.subscriptionId).subscribe({
      next: (delSubs: any) => {
        this.delSubsDetails = delSubs;
      },
      error: err => {
        console.log(err);
        alert('An error occurred');
      }
    })
  }

}
