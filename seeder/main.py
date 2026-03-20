import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from simulator import NetworkSimulator
from serializer import save

if __name__ == "__main__":
    simulator = NetworkSimulator()
    G = simulator.simulate()
    simulator.summary(G)
    save(G, "network")
