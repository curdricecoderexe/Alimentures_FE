# Phase 8: Search, Filtering & Product Discovery Audit

## 1. Forensic Search Audit

| Feature | Existing Implementation | Problem | Recommendation |
| :--- | :--- | :--- | :--- |
| **Search (API)** | None | No backend endpoint for searching/filtering. | Implement `GET /api/products/search` in `productController.js`. |
| **Search (Client)** | Simple `.filter()` in `CustomerLayout.jsx` | Downloads products via `/products?limit=20` and filters on the client. Only searches name/category. | Remove client-side filtering. Use the new `/search` API with debouncing. |
| **Shop Page** | Missing | No dedicated `/shop` route for discovery. | Create `Shop.jsx` with URL-state driven search/filtering. |
| **Typo Tolerance** | None | Client-side `.includes()` is strict and case-sensitive. | Implement lightweight typo tolerance (e.g. Levenshtein distance) in the backend's `/search` endpoint, noting Firestore's limitation. |
| **Category Filter** | Client-side in `Home.jsx` | Filters locally on fetched products. | Move to backend `category` filter via `/search`. |
| **Price Filter** | None | Users cannot filter by price. | Add `minPrice` and `maxPrice` querying to `/search`. |
| **Availability Filter**| None | Cannot hide out-of-stock products. | Add `inStockOnly` flag. |
| **Sorting** | Hardcoded by `createdAt` in API | Cannot sort by price or relevance. | Add `sort` parameter (relevance, price_low_high, price_high_low, newest). |
| **Pagination** | Cursor-based in API (`lastId`), but missing in search | Client-side search doesn't paginate. | Use array slicing on backend for in-memory search results to return `items` and `hasMore`. |
| **Autocomplete** | Rendered in Header, but unoptimized | Re-fetches the same API endpoint. | Use a dedicated autocomplete request with a smaller payload and localized skeleton. |
| **Empty Results** | Clears the array | Shows nothing or basic text. | Implement recovery: popular products, categories, or typo suggestions. |
| **Recently Viewed** | None | No history tracked. | Use `localStorage` to track recently viewed product IDs/data (limit 10). |
| **Related / FBT** | None | Missing discovery mechanisms. | Calculate related products by matching category/tags in backend. |
| **Analytics** | None for search | We don't know what users search for. | Create a `search_analytics` collection in Firestore to log queries. |

### Note on Firestore Limitation
Firestore natively lacks full-text and fuzzy search. Since we are restricted from introducing external providers (like Typesense, Redis, or Algolia) unless absolutely necessary, and given the current relatively small catalog scale typical of this e-commerce stage, the most efficient approach is to maintain an **in-memory cached product catalog on the backend**. This allows complex, combined queries (Search + Category + Price + Sort + Fuzzy Typo Tolerance) to be computed in milliseconds on the Node server, securely paginated, and returned to the client without executing thousands of expensive Firestore reads.

I will now proceed with implementing the search API, building `Shop.jsx`, updating routes, and integrating autocomplete.
