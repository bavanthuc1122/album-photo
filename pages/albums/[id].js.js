import { useRouter } from 'next/router';
import { getAlbum } from '../../lib/api';
import AlbumClient from '../../styles/Albumclient';

export default function AlbumPage({ album }) {
  const router = useRouter();
  const { id } = router.query;

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  return <AlbumClient album={album} />;
}

export async function getStaticPaths() {
  return {
    paths: [], // Để trống để sử dụng fallback
    fallback: true
  };
}

export async function getStaticProps({ params }) {
  try {
    const { id } = params;
    const album = await getAlbum(id);
    
    return {
      props: { album },
      revalidate: 60
    };
  } catch (error) {
    console.error('Error in getStaticProps:', error);
    return { notFound: true };
  }
}