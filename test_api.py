#!/usr/bin/env python3
import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_register():
    """Test user registration"""
    url = f"{BASE_URL}/auth/register"
    payload = {
        "username": "testuser1",
        "password": "testpass123"
    }
    
    response = requests.post(url, json=payload)
    print(f"Register Status: {response.status_code}")
    data = response.json()
    print(f"Response: {json.dumps(data, indent=2)}")
    return data

def test_login(username, password):
    """Test user login"""
    url = f"{BASE_URL}/auth/login"
    payload = {
        "username": username,
        "password": password
    }
    
    response = requests.post(url, json=payload)
    print(f"\nLogin Status: {response.status_code}")
    data = response.json()
    print(f"Response: {json.dumps(data, indent=2)}")
    return data

def test_categories():
    """Test get categories"""
    url = f"{BASE_URL}/items/categories/all"
    response = requests.get(url)
    print(f"\nCategories Status: {response.status_code}")
    data = response.json()
    print(f"Categories: {json.dumps(data, indent=2)}")
    return data

def test_prices():
    """Test get prices"""
    url = f"{BASE_URL}/items/prices/all"
    response = requests.get(url)
    print(f"\nPrices Status: {response.status_code}")
    data = response.json()
    print(f"Number of prices: {len(data)}")
    if data:
        print(f"First price: {json.dumps(data[0], indent=2)}")

if __name__ == "__main__":
    print("=== Testing UNILAG Price Saver API ===\n")
    
    try:
        # Test registration
        print("1. Testing Registration...")
        register_data = test_register()
        
        # Test login
        print("\n2. Testing Login...")
        login_data = test_login("testuser1", "testpass123")
        
        # Test categories
        print("\n3. Testing Categories Endpoint...")
        test_categories()
        
        # Test prices
        print("\n4. Testing Prices Endpoint...")
        test_prices()
        
        print("\n✅ All tests completed!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
