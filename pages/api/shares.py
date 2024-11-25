from flask import request, jsonify
from database.db_operations import execute_query
from utils.token_generator import generate_unique_token

@app.route('/api/shares', methods=['POST'])
def create_share():
    try:
        data = request.get_json()
        album_id = data.get('albumId')
        username = data.get('username')
        password = data.get('password')  # Optional
        is_public = data.get('isPublic', False)
        
        share_token = generate_unique_token()
        
        query = """
            INSERT INTO shares (album_id, share_token, username, password, is_public)
            VALUES (%s, %s, %s, %s, %s)
        """
        execute_query(query, (album_id, share_token, username, password, is_public))
        
        return jsonify({
            'success': True,
            'shareUrl': f"/shared/{share_token}"
        })
    except Exception as e:
        print(f"Share creation error: {str(e)}")
        return jsonify({'error': str(e)}), 500 