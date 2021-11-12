import Prismic from '@prismicio/client';
import { format as formatDate } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { getPrismicClient } from '../../services/prismic';
import styles from './post.module.scss';



interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({post}: PostProps) {

  const router = useRouter()
  if(router.isFallback){
    return <h1>Carregando...</h1>
  }
  const totalWords = post.data.content.reduce(
    (totalContent, currentContent) => {
      const headingWords = currentContent.heading?.split(' ').length || 0;

      const bodyWords = currentContent.body.reduce((totalBody, currentBody) => {
        const textWords = currentBody.text.split(' ').length;
        return totalBody + textWords;
      }, 0);

      return totalContent + headingWords + bodyWords;
    },
    0
  )
  const timeEstimmed = Math.ceil(totalWords / 200);

  return (
    <>
      {/* <Head>
        <title>{post.data.title} | spacetraveling</title>
      </Head> */}

      <img src={post.data.banner.url} alt="banner" />
      <main>
        <article>
          <h1>{post.data.title}</h1>
          <div>
            <time>
              <FiCalendar/>
              {formatDate(new Date(post.first_publication_date), 'dd MMM yyyy', {locale: ptBR})}
            </time>
            <span>
              <FiUser/>
              {post.data.author}
            </span>
            <time>
              <FiClock/>
              {timeEstimmed} min
            </time>
          </div>
          {post.data.content.map(content => {
            return (
              <section key={content.heading} className={styles.postContent}>
                <h2>{content.heading}</h2>
                <div
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(content.body),
                  }}
                ></div>
              </section>
            );
          })}
        </article>
      </main>

    </>
  )
}

export const getStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts')
  ]);

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid
      }
    }
  })

  return {
    paths,
    fallback: true
  }
};

export const getStaticProps: GetStaticProps = async context => {
  const {slug} = context.params

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});
  
  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body]
        }
      })
      
    }
  }
  
  return {
    props: {
      post
    }
  }
  
};

