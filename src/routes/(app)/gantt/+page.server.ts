/**
 * Gantt Chart Page Server Load
 * @module routes/(app)/gantt/+page.server
 *
 * Loads issues from the database for the Gantt timeline view.
 */

import { DataAccessLayer } from '$lib/server/db/dal.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	try {
		const dal = await DataAccessLayer.create();
		const issues = await dal.getIssues();

		// Filter to issues that have dates (due_at or date in title)
		// For now, include all issues - the component will handle date parsing
		const assignees = [...new Set(issues.map((i) => i.assignee).filter(Boolean))] as string[];

		return {
			issues,
			assignees
		};
	} catch (error) {
		console.error('Failed to load issues for Gantt:', error);
		return {
			issues: [],
			assignees: [],
			error: error instanceof Error ? error.message : 'Failed to load issues'
		};
	}
};
