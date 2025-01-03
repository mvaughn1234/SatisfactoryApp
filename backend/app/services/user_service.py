from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.utils import get_session
from app.models import User

class UserService:
    @staticmethod
    def load_user(user_key: str, session: Session = None) -> User:
        # Manage the session context
        manage_session = session is None  # Determine if we need to create/manage the session
        session = session or get_session()

        try:
            # Attempt to load the user
            user = session.query(User).filter(User.user_key == user_key).first()
            if user:
                return user

            # User does not exist; try to create it
            new_user = User(user_key=user_key)
            session.add(new_user)
            try:
                session.commit()
                return new_user
            except IntegrityError:
                session.rollback()
                # Handle the race condition if another process created the user
                user = session.query(User).filter(User.user_key == user_key).first()
                if user:
                    return user
                # Raise an exception or handle the unexpected case
                raise RuntimeError(f"Failed to create or retrieve user with key: {user_key}")
        finally:
            # Close the session if we created it
            if manage_session:
                session.close()
