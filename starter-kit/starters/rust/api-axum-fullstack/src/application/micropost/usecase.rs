use std::sync::Arc;

use crate::domain::micropost::repository::MicropostRepository;

use super::dto::{CreateMicropostInput, MicropostOutput};

pub struct MicropostUseCase {
    repo: Arc<dyn MicropostRepository>,
}

impl MicropostUseCase {
    pub fn new(repo: Arc<dyn MicropostRepository>) -> Self {
        Self { repo }
    }

    pub fn list(&self) -> Vec<MicropostOutput> {
        self.repo.list().into_iter().map(Into::into).collect()
    }

    pub fn find_by_id(&self, id: i64) -> Option<MicropostOutput> {
        self.repo.find_by_id(id).map(Into::into)
    }

    pub fn create(&self, input: CreateMicropostInput) -> MicropostOutput {
        self.repo.create(&input.title).into()
    }
}
