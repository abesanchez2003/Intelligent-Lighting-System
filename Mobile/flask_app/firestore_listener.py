import firebase_admin
from firebase_admin import credentials, firestore

# lightingcontrol-84527-firebase-adminsdk-fbsvc-027b0a982b.json
# Initialize Firebase app with service account
cred = credentials.Certificate('lightingcontrol-84527-firebase-adminsdk-fbsvc-027b0a982b.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

# Callback for Firestore snapshot listener
def on_snapshot(col_snapshot, changes, read_time):
	print("All docs in snapshot (ordered by query):")
	for doc in col_snapshot:
		doc_dict = doc.to_dict()
		print(f"{doc.id}: {doc_dict.get('timestamp')}")
	for change in changes:
		doc_dict = change.document.to_dict()
		ts = doc_dict.get('timestamp', None)
		topic = doc_dict.get('topic', None)
		value = doc_dict.get('value', None)
		print(f"Doc {change.document.id} timestamp: {ts} (type: {type(ts)}) topic: {topic} value: {value}")
		if change.type.name == 'ADDED':
			print(f"New command: {change.document.id} => {doc_dict}")
		elif change.type.name == 'MODIFIED':
			print(f"Modified command: {change.document.id} => {doc_dict}")
		elif change.type.name == 'REMOVED':
			print(f"Removed command: {change.document.id}")

# Listen for 'pending' commands, ordered by timestamp descending
commands_ref = db.collection('commands').where('status', '==', 'pending').order_by('timestamp', direction=firestore.Query.DESCENDING)
commands_ref.on_snapshot(on_snapshot)

print("Listening to Firestore changes... (Press Ctrl+C to exit)")
import time
while True:
	time.sleep(1)
