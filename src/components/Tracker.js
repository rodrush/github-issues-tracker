import React, { Component } from "react";
import "../App.css";
import axios from "axios";

const axiosGitHubGraphQL = axios.create({
	baseURL: "https://api.github.com/graphql",
	headers: {
		Authorization: `bearer ${process.env.REACT_APP_GITHUB_PERSONAL_ACCESS_TOKEN}`,
	},
});

const GET_ISSUES_OF_REPOSITORY = `
  query ($organization: String!, $repository: String!, $cursor: String) {
    organization(login: $organization) {
      name
      url
      repository(name: $repository) {
        name
        url
        issues(first: 35, after: $cursor, states: [OPEN]) {
          edges {
            node {
              id
              title
              url
            }
          }
          totalCount
          pageInfo {
            endCursor
            hasNextPage
          }
        }
      }
    }
  }
`;

const getIssuesOfRepository = (path, cursor) => {
	const [organization, repository] = path.split("/");

	return axiosGitHubGraphQL.post("", {
		query: GET_ISSUES_OF_REPOSITORY,
		variables: { organization, repository, cursor },
	});
};

const resolveIssuesQuery = (queryResult, cursor) => (state) => {
	const { data, errors } = queryResult.data;

	if (!cursor) {
		return {
			organization: data.organization,
			errors,
		};
	}

	const { edges: oldIssues } = state.organization.repository.issues;
	const { edges: newIssues } = data.organization.repository.issues;
	const updatedIssues = [...oldIssues, ...newIssues];

	return {
		organization: {
			...data.organization,
			repository: {
				...data.organization.repository,
				issues: {
					...data.organization.repository.issues,
					edges: updatedIssues,
				},
			},
		},
		errors,
	};
};

class Track extends Component {
	state = {
		path: "facebook/react",
		organization: null,
		errors: null,
	};

	componentDidMount() {
		// fetch data
		this.onFetchFromGitHub(this.state.path);
	}

	onChange = (event) => {
		this.setState({ path: event.target.value });
	};

	onSubmit = (event) => {
		this.onFetchFromGitHub(this.state.path);

		event.preventDefault();
	};

	onFetchFromGitHub = (path, cursor) => {
		getIssuesOfRepository(path, cursor).then((queryResult) =>
			this.setState(resolveIssuesQuery(queryResult, cursor))
		);
	};

	render() {
		const { path, organization, errors } = this.state;

		return (
			<div>
				<section>
					<form className="search" onSubmit={this.onSubmit}>
						<p className="intro">
							Enter organization name and repository separated by /{" "}
						</p>
						<input
							id="url"
							type="text"
							placeholder=" Search by Language Name"
							value={path}
							onChange={this.onChange}
						></input>
						<button type="submit" className="search2">
							Search
						</button>
					</form>

					<aside className="tag">
						<button type="button" className="js">
							JavaScript
						</button>
						<button type="button" className="html">
							HTML
						</button>
						<button type="button" className="css">
							CSS
						</button>
						<button type="button" className="java">
							Java
						</button>
						<button type="button" className="tscript">
							TypeSript
						</button>
					</aside>
				</section>

				<hr />
				{organization ? (
					<Organization organization={organization} errors={errors} />
				) : (
					<p>No information yet ...</p>
				)}
			</div>
		);
	}
}

const Organization = ({ organization, errors }) => {
	if (errors) {
		return (
			<p>
				<strong>Something went wrong:</strong>
				{errors.map((error) => error.message).join(" ")}
			</p>
		);
	}

	return (
		<div>
			<p className="org">
				<strong>Issues from Organization:</strong>
				<a href={organization.url}>{organization.name}</a>
			</p>
			<Repository repository={organization.repository} />
		</div>
	);
};

const Repository = ({ repository }) => (
	<div className="container">
		<p className="repo">
			<strong>In Repository:</strong>
			<a href={repository.url}>{repository.name}</a>
		</p>
		<hr />
		<article>
			<ul className="issues">
				{repository.issues.edges.map((issue) => (
					<li key={issue.node.id}>
						<a href={issue.node.url}>{issue.node.title}</a>
					</li>
				))}
			</ul>
		</article>
	</div>
);

export default Track;
