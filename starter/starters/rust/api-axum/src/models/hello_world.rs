use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct HelloWorldResponse {
    pub message: String,
}

#[derive(Serialize, Deserialize)]
pub struct GreetResponse {
    pub message: String,
    pub name: String,
}
