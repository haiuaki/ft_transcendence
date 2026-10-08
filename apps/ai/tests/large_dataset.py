import json
from pathlib import Path
import uuid

ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
OUTPUT_FILE = ROOT_DIR / "dataset.json"

PASSWORD_HASH = "$2a$14$RClFzJq4po6aw/rdFmFRO.HAUAKEh6V3bq0xgDxePGxed2D0KALeu"


def generate_large_dataset(
    num_users: int = 50,
    num_channels: int = 10,
    num_messages: int = 200,
):
    """Generates a large test dataset using simple loops."""
    users = []
    user_ids = []
    for i in range(1, num_users + 1):
        u_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"user_{i}"))
        user_ids.append(u_id)
        users.append({
            "id": u_id,
            "username": f"user{i}",
            "email": f"user{i}@test.com",
            "password_hash": PASSWORD_HASH,
            "avatar_url": None,
            "is_verified": True,
            "verification_token": None,
            "is_2fa_enabled": False,
            "two_factor_secret": None,
            "status": "ONLINE" if i <= 5 else "OFFLINE",
            "total_messages_sent": 0,
            "cumulative_time_seconds": i * 60,
            "created_at": "2026-10-01 10:00:00+00:00",
            "updated_at": "2026-10-01 10:00:00+00:00",
            "deleted_at": None,
        })

    channels = []
    for c_id in range(1, num_channels + 1):
        channels.append({
            "id": c_id,
            "name": f"channel_test{c_id}",
            "type": "PUBLIC",
            "model_type": "CLUSTER",
            "max_capacity": 10,
            "password_hash": None,
            "owner_id": user_ids[0],
            "created_at": "2026-10-01 10:00:00+00:00",
        })

    channel_members = []
    for c in channels:
        for u_idx in range(5):
            u_id = user_ids[(c["id"] + u_idx) % len(user_ids)]
            channel_members.append({
                "channel_id": c["id"],
                "user_id": u_id,
                "role": "OWNER" if u_idx == 0 else "MEMBER",
                "status": "ACTIVE",
                "joined_at": "2026-10-01 10:00:00+00:00",
            })

    friendships = []
    for i in range(min(20, num_users - 1)):
        friendships.append({
            "id": i + 1,
            "user_id": user_ids[i],
            "friend_id": user_ids[i + 1],
            "status": "ACCEPTED",
        })

    messages = []
    for m_id in range(1, num_messages + 1):
        sender_id = user_ids[(m_id - 1) % len(user_ids)]
        channel_id = (m_id % num_channels) + 1
        content = f"message test {m_id}"

        user_idx = (m_id - 1) % len(user_ids)
        users[user_idx]["total_messages_sent"] += 1

        messages.append({
            "id": m_id,
            "sender_id": sender_id,
            "channel_id": channel_id,
            "content": content,
            "embedding": None,
            "created_at": f"2026-10-08 10:00:00+00:00",
        })

    dataset = {
        "users": users,
        "channels": channels,
        "channel_members": channel_members,
        "friendships": friendships,
        "messages": messages,
    }

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2, ensure_ascii=False)

    container_output = Path(__file__).resolve().parent.parent / "dataset.json"
    with open(container_output, "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2, ensure_ascii=False)

    print(f"[SUCCESS] Dataset généré avec succès !")
    print(f" -> Fichier : {OUTPUT_FILE}")
    print(f" -> Users : {len(users)}")
    print(f" -> Channels : {len(channels)}")
    print(f" -> Channel Members : {len(channel_members)}")
    print(f" -> Friendships : {len(friendships)}")
    print(f" -> Messages : {len(messages)} (format 'message test X')")
    print("\nPour importer dans la base de données :")
    print(" docker compose exec ai-service python import_dataset.py")


if __name__ == "__main__":
    generate_large_dataset()
