SEED = 42
NUM_USERS = 1500  # how many users to sample from dataset
NUM_INSTANCES = 15  # how many instances to distribute across

# If non-empty, usernames become "{PREFIX}_user_0001" and post ids "p_PREFIX_000001"
# so a new run does not collide with an older seed on the same Docker DBs. Use "" after wiping volumes.
USERNAME_PREFIX = ""

DEFAULT_PASSWORD = "passw0rd!"

FOLLOW_POWER_LAW_EXPONENT = 2.0  # power law exponent for follow graph
POPULARITY_ZIPF_EXPONENT = 2.0  # in-degree: how skewed popularity/followership is

# Dataset
CSV_PATH = "labeled_posts.csv"
MIN_POSTS_PER_AUTHOR = 1  # drop authors with fewer posts than this

# Instance distribution
INSTANCE_ALPHA = 1.0  # higher = more equal split across instances

# Follow graph (power law)
AVG_FOLLOWS = 300  # average follows per user
LOCAL_BIAS = 0.65  # 80% of follows within same instance

DAYS_BACK_FOR_POSTS = 356  # each post gets a random created_at in this range
