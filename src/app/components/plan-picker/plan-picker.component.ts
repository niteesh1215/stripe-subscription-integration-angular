import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { PlanType } from 'src/app/model/plan-type.model';


@Component({
  selector: 'app-plan-picker',
  templateUrl: './plan-picker.component.html',
  styleUrls: ['./plan-picker.component.css']
})
export class PlanPickerComponent implements OnInit {

  @Input() hiddenPlan?: string

  @Output() selectedPlanEvent = new EventEmitter<string>();

  Plan = PlanType;

  constructor() { }

  ngOnInit(): void {
  }

  selectPlan(planType: string) {
    this.selectedPlanEvent.emit(planType);
  }
}
