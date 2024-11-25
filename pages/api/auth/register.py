# register_handler.py

from ..handlers.register_handler import RegisterHandler
from flask import jsonify

@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        username = data['username']
        
        # 1. Create user in database
        user = create_user_in_db(data)
        
        # 2. Create folders
        handler = RegisterHandler()
        success = handler.create_user_folders(username)
        
        if not success:
            # Nếu tạo folder fail -> rollback user
            delete_user_from_db(user.id)
            return jsonify({
                'error': 'Failed to create user folders'
            }), 500
            
        return jsonify({
            'success': True,
            'user': user
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500