import { posts } from '../_posts';

export function get(req) {
	const post = posts.find((p) => p.metadata.slug === req.params.slug);
	return {
		body: { post },
		headers: {
			'Cache-Control': `max-age=0, s-max-age=${600}` // 10 minutes
		}
	};
}
