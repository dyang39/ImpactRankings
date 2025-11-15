# Frequently Asked Questions (FAQ)

Q: Are there plans to open-source the ranking code and more low-level data?
A: Yes we plan to be more open in the future and involve the community more, with the first release we decided to release a limited amount of data to first gather community opinions about this approach.

Q: Is there some known issues to the methodology?
A: Yes. There are several known issues:

1) Some authors are counted as two different persons. We will strive to fix those.
2) Some famous papers that are universally applicable (e.g. Adam, layer normalization) are cited across multiple domains and then scores are accumulated by the same author on multiple domains. Hence the scores on a particular domain may not reflect contribution on that exact domain.
3) There are mismatches and missed matches from DBLP, we tried our best but still cannot match all the papers.
4) The LLM sometimes fail to return any useful references on some papers. We have done our best to remove hallucinated references, but there could still be issues.

Q: My name/affiliation is wrong, how can I fix it?
A: Please submit an issue in the GitHub repository.

Q: How are the areas and conferences selected?
A: We followed CSRankings in general. We have only limited computational resources hence are only capable to run these four areas for the current release.

Q: What are the criteria for including faculty?
A: We follow the CSRankings database.
