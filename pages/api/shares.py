from flask import request, jsonify
import secrets
from lib.database import execute_query

@app.route('/api/shares', methods=['POST'])
def create_share():
    try:
        data = request.get_json()
        album_id = data.get('albumId')
        username = data.get('username')
        password = data.get('password')
        is_public = data.get('isPublic', False)
        
        # Kiểm tra album tồn tại
        album_query = "SELECT id FROM albums WHERE id = %s AND username = %s"
        album = execute_query(album_query, (album_id, username))
        if not album:
            return jsonify({'error': 'Album not found'}), 404
        
        # Tạo share token
        share_token = secrets.token_urlsafe(16)
        
        # Tạo share mới
        query = """
            INSERT INTO shares 
            (album_id, share_token, username, password, is_public)
            VALUES (%s, %s, %s, %s, %s)
        """
        execute_query(
            query, 
            (album_id, share_token, username, password, is_public),
            'photo_albums'  # Chỉ định database
        )
        
        return jsonify({
            'success': True,
            'shareUrl': f"/shared/{share_token}"
        })
        
    except Exception as e:
        print(f"Share creation error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/shares/<token>', methods=['GET'])
def get_share(token):
    try:
        query = """
            SELECT s.*, a.title as album_title 
            FROM shares s
            JOIN albums a ON s.album_id = a.id
            WHERE s.share_token = %s
        """
        result = execute_query(query, (token,), 'photo_albums')
        
        if not result:
            return jsonify({'error': 'Share not found'}), 404
            
        share = result[0]
        return jsonify({
            'albumId': share['album_id'],
            'albumTitle': share['album_title'],
            'isPublic': share['is_public'],
            'requiresPassword': bool(share['password'])
        })
        
    except Exception as e:
        print(f"Error getting share: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Endpoint để verify password cho private shares
@app.route('/api/shares/<token>/verify', methods=['POST'])
def verify_share_password(token):
    try:
        data = request.get_json()
        password = data.get('password')
        
        query = "SELECT password FROM shares WHERE share_token = %s"
        result = execute_query(query, (token,), 'photo_albums')
        
        if not result:
            return jsonify({'error': 'Share not found'}), 404
            
        stored_password = result[0]['password']
        
        if stored_password != password:
            return jsonify({'error': 'Invalid password'}), 403
            
        return jsonify({'success': True})
        
    except Exception as e:
        print(f"Error verifying password: {str(e)}")
        return jsonify({'error': str(e)}), 500 