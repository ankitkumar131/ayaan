import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../shared/models/product.model';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  featuredProducts: Product[] = [];
  newArrivals: Product[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadFeaturedProducts();
    this.loadNewArrivals();
  }

  loadFeaturedProducts(): void {
    this.productService.getFeaturedProducts().subscribe({
      next: (products) => {
        this.featuredProducts = products;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load featured products';
        this.isLoading = false;
        console.error('Error loading featured products', err);
      }
    });
  }

  loadNewArrivals(): void {
    this.productService.getNewArrivals().subscribe({
      next: (products) => {
        this.newArrivals = products;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load new arrivals';
        this.isLoading = false;
        console.error('Error loading new arrivals', err);
      }
    });
  }
}