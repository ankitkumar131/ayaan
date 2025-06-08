import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Category } from '../../../core/interfaces/category.interface';
import { Product, ProductsResponse } from '../../../core/interfaces/product.interface';
import { CategoryService } from '../../../core/services/category.service';
import { ProductService } from '../../../core/services/product.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule]
})
export class LandingComponent implements OnInit {
  featuredCategories: Category[] = [];
  newArrivals: Product[] = [];
  email = '';

  constructor(
    private categoryService: CategoryService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadFeaturedCategories();
    this.loadNewArrivals();
  }

  private loadFeaturedCategories(): void {
    this.categoryService.getCategories().subscribe(
      (categories: Category[]) => {
        this.featuredCategories = categories.slice(0, 4); // Show only first 4 categories
      },
      (error: unknown) => {
        console.error('Error loading categories:', error);
      }
    );
  }

  private loadNewArrivals(): void {
    this.productService.getProducts({ sort: 'createdAt:desc', limit: 8 }).subscribe(
      (response: ProductsResponse) => {
        this.newArrivals = response.products;
      },
      (error: unknown) => {
        console.error('Error loading new arrivals:', error);
      }
    );
  }

  onSubscribe(): void {
    if (!this.email) return;
    
    // TODO: Implement newsletter subscription
    console.log('Newsletter subscription for:', this.email);
    this.email = '';
  }
}