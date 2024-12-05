"""
This directory contains business logic and separates it from the view logic.
The services layer helps with complex computations, such as:

- Fetching and preparing data for the codex.
- Running the linear optimization routine to rank recipes.
- Calculating production flows.
"""

"""
Actually let me go ahead and tell you what a recipe is going to be used for and how it's going to be displayed. I loved the recap by the way and your understanding of where we left off is perfect! Also, for data visualization I was hoping to use some popular frameworks in the visualization field like DS3, or similar (i think)?

A recipe is a lot of things. For one, it's a relationship between various input(s) that each have their own quantity and output(s) that have each their own quantities as well, and it also has an associated building and a manufacturing time. For example the recipe Recipe: 
"""