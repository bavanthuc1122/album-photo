import { useRouter } from 'next/router';
import AlbumClient from '../../components/Albumclient';


export default function AlbumPage() {
  const router = useRouter();
  const { slug } = router.query;

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  // Lấy album ID từ slug (phần trước random string)
  const albumId = slug?.split('-').slice(0, -1).join('-');

  return <AlbumClient albumId={albumId} />;
}