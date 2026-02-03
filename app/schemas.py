from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional, List

# ============ Category System (Simplified - 3 Categories Only) ============

class CategoryBase(BaseModel):
    name: str  # EDIBLES, DRINKS, or NON-EDIBLES
    icon: Optional[str] = None
    description: Optional[str] = None
    
    @validator('name')
    def validate_category_name(cls, v):
        """Validate category name is not empty"""
        if not v or len(v.strip()) == 0:
            raise ValueError('Category name cannot be empty')
        if len(v) > 100:
            raise ValueError('Category name cannot exceed 100 characters')
        return v.strip()

class CategoryCreate(CategoryBase):
    pass

class CategoryOut(CategoryBase):
    id: int

    class Config:
        from_attributes = True

# ============ Price (Enhanced with Item Details & Validation) ============

class PriceBase(BaseModel):
    category_id: int = Field(gt=0, description="Valid category ID")
    store_id: Optional[int] = Field(None, gt=0, description="Valid store ID if provided")
    name: str = Field(..., min_length=1, max_length=255, description="Item name")
    brand: Optional[str] = Field(None, max_length=100, description="Brand name")
    pack_size: Optional[str] = Field(None, max_length=50, description="Pack size (e.g., '500ml')")
    pack_unit: Optional[str] = Field(None, max_length=20, description="Pack unit (e.g., 'ml', 'kg')")
    price: float = Field(..., gt=0, le=10000000, description="Price in ₦ (must be positive)")
    price_per_unit: Optional[float] = Field(None, gt=0, description="Price per unit if applicable")
    retailer: Optional[str] = Field(None, max_length=100, description="Retailer name")
    location: Optional[str] = Field(None, max_length=200, description="Store location")
    
    @validator('name')
    def validate_name(cls, v):
        """Validate item name is not empty or just whitespace"""
        if not v or len(v.strip()) == 0:
            raise ValueError('Item name cannot be empty')
        return v.strip()
    
    @validator('price')
    def validate_price(cls, v):
        """Validate price is positive and reasonable"""
        if v <= 0:
            raise ValueError('Price must be greater than 0')
        if v > 10000000:
            raise ValueError('Price cannot exceed ₦10,000,000')
        return v
    
    @validator('price_per_unit')
    def validate_price_per_unit(cls, v):
        """Validate price per unit if provided"""
        if v is not None and v <= 0:
            raise ValueError('Price per unit must be greater than 0')
        return v
    
    @validator('pack_size')
    def validate_pack_size(cls, v):
        """Validate pack size format"""
        if v is not None and len(v.strip()) == 0:
            return None
        return v

class PriceCreate(PriceBase):
    pass

class PriceOut(PriceBase):
    id: int
    submitted_by: Optional[int] = None
    submitted_at: datetime
    status: str

    class Config:
        from_attributes = True

# ============ Legacy (for backward compatibility) ============

class ItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    
    @validator('name')
    def validate_item_name(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Item name cannot be empty')
        return v.strip()

class ItemCreate(ItemBase):
    pass

class ItemOut(ItemBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ItemSubmissionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    price: float = Field(..., gt=0, le=10000000)
    location: str = Field(..., min_length=1, max_length=255)
    submitter_email: Optional[str] = Field(None, max_length=255)
    
    @validator('price')
    def validate_submission_price(cls, v):
        if v <= 0 or v > 10000000:
            raise ValueError('Price must be between 0 and ₦10,000,000')
        return v

class ItemSubmissionOut(BaseModel):
    id: int
    name: str
    category: Optional[str]
    price: float
    location: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class PendingPriceCreate(BaseModel):
    item: str
    parsed_price: Optional[float] = None
    location_text: Optional[str] = None
    submitter_email: Optional[str] = None

class PendingPriceOut(BaseModel):
    id: int
    item: str
    parsed_price: Optional[float]
    location_text: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class HeatmapLocation(BaseModel):
    key: str
    name: str
    store_id: Optional[int]
    lat: Optional[float]
    lng: Optional[float]
    count: int
    avg_price: float
    min_price: float
    max_price: float
    intensity: float


class HeatmapResponse(BaseModel):
    item: str
    days: int
    generated_at: datetime
    heatmap: List[HeatmapLocation]

    class Config:
        from_attributes = True

class CheapestLocation(BaseModel):
    price: float
    store: Optional[dict]
    submitted_at: datetime

class SearchResponse(BaseModel):
    item: str
    cheapest: Optional[CheapestLocation]
    top5: List[CheapestLocation]
    heatmap_path: Optional[str]

# Alias for backwards compatibility
PendingPriceResponse = PendingPriceOut
