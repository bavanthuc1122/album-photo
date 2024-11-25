import { useRouter } from 'next/router';
import { getAlbum, getAllAlbumSlugs } from '../../lib/api';
import AlbumClient from '../../styles/Albumclient';

export default function AlbumPage({ album }) {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  return <AlbumClient album={album} />;
}

export async function getStaticPaths() {
  try {
    const paths = await getAllAlbumSlugs();
    console.log('Generated paths:', paths);
    return {
      paths,
      fallback: true
    };
  } catch (error) {
    console.error('Error in getStaticPaths:', error);
    return {
      paths: [],
      fallback: true
    };
  }
}

export async function getStaticProps({ params }) {
  try {
    console.log('Received params:', params);
    
    if (!params?.slug) {
      return { notFound: true };
    }

    const album = await getAlbum(params.slug);
    console.log('Fetched album:', album);
    
    if (!album) {
      return { notFound: true };
    }

    const decodedAlbum = {
      ...album,
      name: decodeURIComponent(album.name)
    };
    console.log('Processed album:', decodedAlbum);
    
    return {
      props: { album: decodedAlbum },
      revalidate: 60
    };
  } catch (error) {
    console.error('Error in getStaticProps:', error);
    return { notFound: true };
  }
}