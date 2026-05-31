use serde::{Deserialize, Serialize};

use crate::domain::micropost::entity::Micropost;

#[derive(Serialize)]
pub struct MicropostOutput {
    pub id: i64,
    pub title: String,
}

#[derive(Deserialize)]
pub struct CreateMicropostInput {
    pub title: String,
}

impl From<Micropost> for MicropostOutput {
    fn from(m: Micropost) -> Self {
        Self {
            id: m.id,
            title: m.title,
        }
    }
}
