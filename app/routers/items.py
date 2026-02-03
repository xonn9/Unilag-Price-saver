from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Price, Category, Store, Item
from app.schemas import (
    PriceCreate, PriceOut,
    CategoryCreate, CategoryOut
)
from typing import List
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter(prefix="/items", tags=["Items"])
limiter = Limiter(key_func=get_remote_address)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ============ CATEGORIES (3-Level) ============

@router.get("/categories/all", response_model=List[CategoryOut])
@limiter.limit("100/minute")
def get_categories(request, db: Session = Depends(get_db)):
    """Get all categories (public, no auth required)"""
    return db.query(Category).all()

@router.post("/categories/", response_model=CategoryOut)
@limiter.limit("10/minute")
def create_category(request, category: CategoryCreate, db: Session = Depends(get_db)):
    """Create a new category"""
    new_cat = Category(**category.dict())
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat

# ============ PRICES (with enhanced details & pagination) ============

@router.get("/prices/all", response_model=List[PriceOut])
@limiter.limit("100/minute")
def get_all_prices(
    request,
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=500, description="Number of records to return (max 500)"),
    db: Session = Depends(get_db)
):
    """
    Get all approved prices with pagination (public, no auth required)
    
    Parameters:
    - skip: Number of records to skip (default: 0)
    - limit: Number of records to return (default: 50, max: 500)
    """
    return db.query(Price).filter(
        Price.status == "approved"
    ).offset(skip).limit(limit).all()

@router.get("/prices/category/{category_id}", response_model=List[PriceOut])
@limiter.limit("100/minute")
def get_prices_for_category(
    request,
    category_id: int = Path(..., gt=0, description="Category ID"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=500, description="Number of records to return (max 500)"),
    db: Session = Depends(get_db)
):
    """
    Get approved prices for a specific category with pagination (public, no auth required)
    
    Parameters:
    - category_id: The category ID to filter by
    - skip: Number of records to skip (default: 0)
    - limit: Number of records to return (default: 50, max: 500)
    """
    # Verify category exists
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return db.query(Price).filter(
        Price.category_id == category_id,
        Price.status == "approved"
    ).offset(skip).limit(limit).all()

@router.post("/prices/", response_model=PriceOut)
@limiter.limit("30/minute")
def submit_price(request, price: PriceCreate, db: Session = Depends(get_db)):
    """Submit a new price (will be pending until admin approval)"""
    # Verify category exists
    category = db.query(Category).filter(Category.id == price.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Verify store exists if provided
    if price.store_id:
        store = db.query(Store).filter(Store.id == price.store_id).first()
        if not store:
            raise HTTPException(status_code=404, detail="Store not found")
    
    new_price = Price(**price.dict())
    if not new_price.status:
        new_price.status = "pending"
    
    db.add(new_price)
    db.commit()
    db.refresh(new_price)
    return new_price

@router.get("/prices/pending/", response_model=List[PriceOut])
@limiter.limit("30/minute")
def get_pending_prices(
    request,
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=500, description="Number of records to return (max 500)"),
    db: Session = Depends(get_db)
):
    """Get all pending price submissions with pagination"""
    return db.query(Price).filter(
        Price.status == "pending"
    ).offset(skip).limit(limit).all()

@router.put("/prices/{price_id}/approve")
@limiter.limit("30/minute")
def approve_price(request, price_id: int, db: Session = Depends(get_db)):
    """Admin: Approve a pending price"""
    price = db.query(Price).filter(Price.id == price_id).first()
    if not price:
        raise HTTPException(status_code=404, detail="Price not found")
    price.status = "approved"
    db.commit()
    return {"status": "approved", "id": price_id}

@router.put("/prices/{price_id}/reject")
@limiter.limit("30/minute")
def reject_price(request, price_id: int, db: Session = Depends(get_db)):
    """Admin: Reject a pending price"""
    price = db.query(Price).filter(Price.id == price_id).first()
    if not price:
        raise HTTPException(status_code=404, detail="Price not found")
    price.status = "rejected"
    db.commit()
    return {"status": "rejected", "id": price_id}

@router.delete("/{item_id}")
@limiter.limit("30/minute")
def delete_item(request, item_id: int, db: Session = Depends(get_db)):
    """Delete an item"""
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db.delete(item)
    db.commit()
    return {"message": "Item deleted successfully"}