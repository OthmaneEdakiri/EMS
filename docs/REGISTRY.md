# API Route Registry

Base path: `/api/v1/...`

| Method | Endpoint | Controller (proposed) | FR | Status |
|--------|----------|----------------------|-----|--------|
| **Auth** | | | |
| POST | `/register` | `Auth\RegisteredUserController@register` | FR-1 | ✅ |
| POST | `/login` | `Auth\AuthController@store` | FR-2 | ✅ |
| POST | `/logout` | `Auth\AuthController@destroy` | — | ✅ |
| GET | `/user` | Closure (returns `$request->user()`) | — | ✅ |
| POST | `/password/change` | `Auth\PasswordChangeController@store` | FR-3 | ✅ |
| **Team** | | | |
| GET | `/users` | `Auth\StaffController@index` | FR-3 | ✅ |
| POST | `/users` | `Auth\StaffController@store` | FR-3 | ✅ |
| DELETE | `/users/{user}` | `Auth\StaffController@destroy` | FR-3 | ✅ |
| **Customers** | | | |
| GET | `/customers` | `CustomerController@index` | FR-4 | ✅ |
| POST | `/customers` | `CustomerController@store` | FR-4 | ✅ |
| GET | `/customers/{customer}` | `CustomerController@show` | FR-4 | ✅ |
| PATCH | `/customers/{customer}` | `CustomerController@update` | FR-4 | ✅ |
| DELETE | `/customers/{customer}` | `CustomerController@destroy` | FR-4 | ✅ |
| **Products** | | | |
| GET | `/products` | `ProductController@index` | FR-5 | ✅ |
| POST | `/products` | `ProductController@store` | FR-5 | ✅ |
| GET | `/products/{product}` | `ProductController@show` | FR-5 | ✅ |
| PATCH | `/products/{product}` | `ProductController@update` | FR-5 | ✅ |
| DELETE | `/products/{product}` | `ProductController@destroy` | FR-5 | ✅ |
| **Invoices** | | | |
| GET | `/invoices` | `InvoiceController@index` | FR-9 | ❌ |
| POST | `/invoices` | `InvoiceController@store` | FR-6 | ❌ |
| GET | `/invoices/{invoice}` | `InvoiceController@show` | FR-6 | ❌ |
| PATCH | `/invoices/{invoice}` | `InvoiceController@update` | FR-6 | ❌ |
| DELETE | `/invoices/{invoice}` | `InvoiceController@destroy` | FR-6 | ❌ |
| POST | `/invoices/{invoice}/send` | `InvoiceController@send` | FR-6 | ❌ |
| POST | `/invoices/{invoice}/cancel` | `InvoiceController@cancel` | §8 | ❌ |
| GET | `/invoices/{invoice}/pdf` | `InvoiceController@downloadPdf` | FR-7 | ❌ |
| **Payments** | | | |
| POST | `/invoices/{invoice}/payments` | `PaymentController@store` | FR-8 | ❌ |

**Status:** ✅ = Implemented, ❌ = Not yet implemented
