import type { Micropost } from '../types'

interface PostTableProps {
  posts: Micropost[]
}

export function PostTable({ posts }: PostTableProps) {
  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>タイトル</th>
        </tr>
      </thead>
      <tbody>
        {posts.map((post) => (
          <tr key={post.id}>
            <td className="id-cell">#{post.id}</td>
            <td>{post.title}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
