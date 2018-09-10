# Software-Engineering-Project-
built a robust backend for quickly and flexibly querying a diverse dataset
1. built a query engine to answer queries about UBC course sections
- imported data about ubc courses into the project and enabled flexible querying over these data with a flexible domain-specific query language
- parse valid input files into internal objects or other data structures
- built the backend to reply to query about the dataset and the query will be based on the EBN.
- wrote unit tests 
2. extended the input data to include data about the physical spaces where classes are held on UBC campus
- parsed the HTML files
- encoded buildings' addresses to a latitude/longitude pair (using online web services)
- extended the query language to accommodate queries to a new dataset
3. complemented backend with a Web server and a frontend UI such that the software can be deployed and used as a Web application
- used REST endpoints
- implemented frontend UI


** note node_modules is missing
