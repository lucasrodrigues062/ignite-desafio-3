/* eslint-disable prettier/prettier */
import Prismic from '@prismicio/client';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import { getPrismicClient } from '../services/prismic';
import styles from './home.module.scss';
import { FiCalendar, FiUser} from 'react-icons/fi'
import { useEffect, useState } from 'react';
import { format as formatDate } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';


interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({postsPagination}: HomeProps) {
  const [nextPage, setNextPage] = useState(postsPagination.next_page)

  const formattedPosts = postsPagination.results.map(post => {
    return {
      ...post,
      first_publication_date: formatDate(new Date(post.first_publication_date), 'dd MMM yyyy', {locale: ptBR}),
    };
  });

  const [posts, setPosts] = useState<Post[]>(formattedPosts);

  async function handleLoadMorePosts(): Promise<void> {
    const newPostsPagination = await fetch(nextPage).then(response =>
      response.json()
    );

    setNextPage(newPostsPagination.next_page);

    const newFormattedPosts = newPostsPagination.results.map(post => {
      return {
        ...post,
        first_publication_date: formatDate(new Date(post.first_publication_date), 'dd MMM yyyy', {locale: ptBR}),
      };
    });

    setPosts([...posts, ...newFormattedPosts]);
  }

  return(
    <main>
    <div className={styles.posts}>
      {posts?.map(post => (
        <Link key={post.uid} href={`/post/${post.uid}`}>
          <a>
            <strong>{post.data.title}</strong>
            <p>{post.data.subtitle}</p>
            <div >
              <time>
                <FiCalendar />
                {post.first_publication_date}
              </time>
              <span>
                <FiUser />
                {post.data.author}
              </span>
            </div>
          </a>
        </Link>
      ))}
      {nextPage && (
        <button type="button" onClick={handleLoadMorePosts}>
          Carregar mais posts
        </button>
      )}
    </div>
  </main>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: posts,
  };

  return {
    props: {
      postsPagination,
    },
  };
};
