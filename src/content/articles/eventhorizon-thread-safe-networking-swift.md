---
title: 'EventHorizon — A thread-safe networking layer in Swift with Sendable and async-await'
description: 'EventHorizon is a lightweight, thread-safe Swift package for building a clean, type-safe network communication layer with Swift 6, Sendable and async/await.'
date: 2025-04-09
tags: ['iOS', 'Swift', 'Networking', 'Concurrency', 'async-await']
heroImage: '/articles/covers/eventhorizon-thread-safe-networking-swift.png'
repoUrl: 'https://github.com/egzonpllana/event-horizon-ios'
---

EventHorizon is a lightweight, thread-safe package designed to build a clean and organized network communication layer in Swift. It offers a type-safe and customizable approach to handling network requests with the latest Swift 6 features.

The name EventHorizon represents the package's role as the ultimate control point for network requests. Just as an event horizon marks the boundary of a black hole, where nothing escapes its pull, this package captures, shapes, and directs network communication with precision. It ensures that every request and response passes through a structured and seamless pipeline, making network communication both reliable and efficient.

> Elegant and type-safe API

## Features

- Type-safe network requests using Swift's generics.
- Asynchronous execution with Swift's async/await.
- Multi-part request support with progress tracking.
- Interceptor-based customization for request and response handling.
- Direct access to URLSession for low-level operations, SSL pining, mocking, caching rules, unit testing, and more.

## Interceptors

EventHorizon includes a set of built-in interceptors, but you can create and inject your custom interceptors as needed.

- `AuthInterceptor` — Injects an authorization token into network requests.
- `LoggingInterceptor` — Logs request and response details for debugging.
- `RequestTimeoutInterceptor` — Configures custom timeout intervals for requests.
- `HeaderInjectorInterceptor` — Adds custom headers to outgoing requests.
- `RetryInterceptor` — Automatically retries failed requests based on status codes.

## Networking Layer — Data Flow

### API Layer components

- `APIEndpoint`: Defines API routes and configurations.
- `APIClient`: Manages network requests and responses.
- `Network Interceptor`: Handles request modifications (e.g., authentication, logging).

**Role:** This layer abstracts networking details, ensuring maintainability and separation of concerns.

**Flow:** The repository calls `APIEndpoint` → passes it to `APIClient` → processed through Network Interceptor before sending the request.

### URLSession

**Role:** The final networking component that executes HTTP requests and retrieves responses.

**Flow:** `APIClient` sends the request via `URLSession`, receives the response, and decodes it using `JSONDecoder`.

### Data Flow

1. Repository interacts with `APIEndpoint` and `APIClient`.
2. Network Interceptor modifies the request (if needed) before reaching `URLSession`.
3. URLSession fetches data from the remote server.
4. Response data is decoded and propagated back through the layers.

## Example

Create an APIClient instance with interceptors:

```swift
import EventHorizon

let apiClient = APIClient(
    interceptors: [ // Inject any NetworkInterceptor
        LoggingInterceptor()
    ]
)

// Request with expected response
let posts: [PostDTO] = try await apiClient.request(APIEndpoint.posts)

// Request Void
try await apiClient.request(APIEndpoint.createPost(newPost))

// Multi-part request with tracking progress
try await apiClient.request(
    APIEndpoint.uploadImage(...),
    progressDelegate: UploadProgressDelegateProtocol
)
```

## Unit Testing with MockAPIClient

You can use `MockAPIClient` to mock network requests while unit testing your `ViewModel`.

```swift
import XCTest
@testable import EventHorizon

final class MyViewModelTests: XCTestCase {
    var mockAPIClient: MockAPIClient!
    var viewModel: MyViewModel!

    override func setUp() async throws {
        mockAPIClient = MockAPIClient()
        viewModel = MyViewModel(apiClient: mockAPIClient)
    }

    func testFetchData_Success() async throws {
        let mockResponse = MockResponse(message: "Success")
        try mockAPIClient.setMockResponse(mockResponse, for: .fetchData)

        try await viewModel.fetchData()

        XCTAssertEqual(viewModel.message, "Success")
    }

    func testFetchData_Failure() async throws {
        mockAPIClient.setShouldThrowError(true)

        do {
            try await viewModel.fetchData()
            XCTFail("Expected error but got success.")
        } catch {
            XCTAssertNotNil(error)
        }
    }
}
```

## Mocking URL Session

You can use a custom URL Session and Interceptors to inject into the APIClient.

```swift
let apiClient = APIClient(
    session: NetworkSessionProtocol, // Inject any NetworkSession
    interceptors: [any NetworkInterceptor] // Inject any interceptors
)
```

## Links

- EventHorizon package: [https://github.com/egzonpllana/EventHorizon](https://github.com/egzonpllana/EventHorizon)
- Real app example: [https://github.com/egzonpllana/NetworkLayerSwift6](https://github.com/egzonpllana/NetworkLayerSwift6)
- The meaning behind this package name — EventHorizon: [https://www.space.com/black-holes-event-horizon-explained.html](https://www.space.com/black-holes-event-horizon-explained.html)

## Let's Connect

- LinkedIn: [https://www.linkedin.com/in/egzon-pllana](https://www.linkedin.com/in/egzon-pllana)
- GitHub: [https://github.com/egzonpllana](https://github.com/egzonpllana)
