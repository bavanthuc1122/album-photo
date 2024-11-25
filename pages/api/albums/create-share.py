@app.route('/api/albums/create-share', methods=['POST'])
def create_share_link():
    try:
        data = request.get_json()
        album_name = data.get('albumName')
        username = data.get('username')
        
        # 1. Lấy folder_id và kiểm tra share_token đã tồn tại chưa
        result = execute_query("""
            SELECT f.folder_id, a.id as album_id, pi.share_token
            FROM folders f
            JOIN albums a ON f.album_id = a.id
            LEFT JOIN photo_interactions pi ON a.id = pi.album_id
            WHERE a.title = %s AND a.username = %s
            LIMIT 1
        """, (album_name, username))
        
        if not result:
            return jsonify({'error': 'Album not found'}), 404
            
        folder_id = result[0]['folder_id']
        album_id = result[0]['album_id']
        existing_token = result[0].get('share_token')
        
        # 2. Nếu đã có token thì dùng lại, không thì tạo mới
        if existing_token:
            share_token = existing_token
        else:
            # Tạo token cố định dựa trên album_id
            share_token = f"share_{album_id}_{folder_id}"
            
            # Lưu token vào database
            execute_query("""
                INSERT INTO photo_interactions 
                (album_id, share_token, created_at)
                VALUES (%s, %s, NOW())
                ON DUPLICATE KEY UPDATE share_token = VALUES(share_token)
            """, (album_id, share_token))
        
        return jsonify({
            'folder_id': folder_id,
            'share_token': share_token
        })
        
    except Exception as e:
        print(f"Error creating share link: {str(e)}")
        return jsonify({'error': str(e)}), 500