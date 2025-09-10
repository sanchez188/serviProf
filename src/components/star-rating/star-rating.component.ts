import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="star-rating" [class.interactive]="interactive">
      <button
        *ngFor="let star of stars; let i = index"
        type="button"
        class="star"
        [class.filled]="i < rating"
        [class.hovered]="interactive && i < hoveredRating"
        (click)="onStarClick(i + 1)"
        (mouseenter)="onStarHover(i + 1)"
        (mouseleave)="onStarLeave()"
        [disabled]="!interactive"
      >
        ★
      </button>
      <span *ngIf="showCount && count" class="rating-count">({{ count }})</span>
    </div>
  `,
  styles: [`
    .star-rating {
      display: flex;
      align-items: center;
      gap: 2px;
    }

    .star {
      background: none;
      border: none;
      font-size: 18px;
      color: #e5e7eb;
      cursor: default;
      padding: 0;
      transition: all 0.2s ease;
    }

    .star.filled {
      color: #fbbf24;
    }

    .interactive .star {
      cursor: pointer;
    }

    .interactive .star:hover,
    .star.hovered {
      color: #f59e0b;
      transform: scale(1.1);
    }

    .rating-count {
      margin-left: 8px;
      font-size: 14px;
      color: #6b7280;
    }
  `]
})
export class StarRatingComponent {
  @Input() rating: number = 0;
  @Input() count?: number;
  @Input() interactive: boolean = false;
  @Input() showCount: boolean = true;
  @Output() ratingChange = new EventEmitter<number>();

  stars = Array(5).fill(0);
  hoveredRating = 0;

  onStarClick(rating: number): void {
    if (this.interactive) {
      this.rating = rating;
      this.ratingChange.emit(rating);
    }
  }

  onStarHover(rating: number): void {
    if (this.interactive) {
      this.hoveredRating = rating;
    }
  }

  onStarLeave(): void {
    this.hoveredRating = 0;
  }
}