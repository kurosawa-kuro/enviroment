use crate::models::hello_world::{GreetResponse, HelloWorldResponse};

pub fn get_hello_world() -> HelloWorldResponse {
    HelloWorldResponse {
        message: "Hello, World!".to_string(),
    }
}

pub fn greet(name: &str) -> GreetResponse {
    GreetResponse {
        message: format!("Hello, {}!", name),
        name: name.to_string(),
    }
}
