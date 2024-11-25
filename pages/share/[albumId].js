import { useRouter } from 'next/router';
import AlbumClient from '../../styles/Albumclient';

export default function SharedAlbum() {
  const router = useRouter();
  const { albumId } = router.query;

  return (
    <AlbumClient 
      isSharedView={true}
      sharedAlbumId={albumId}
    />
  );
}