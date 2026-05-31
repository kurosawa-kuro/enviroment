use super::entity::Micropost;

pub trait MicropostRepository: Send + Sync {
    fn list(&self) -> Vec<Micropost>;
    fn find_by_id(&self, id: i64) -> Option<Micropost>;
    fn create(&self, title: &str) -> Micropost;
}
