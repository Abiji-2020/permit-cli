import { describe, it, expect } from 'vitest';
import {
	mapTrinoSchemaToPermitResources,
	trinoTypeToPermitType, // Now exported for testing
	TrinoSchemaData,
} from '../../source/utils/trinoUtils.js';

describe('trinoTypeToPermitType', () => {
	it('maps Trino types to Permit types', () => {
		expect(trinoTypeToPermitType('varchar')).toBe('string');
		expect(trinoTypeToPermitType('integer')).toBe('number');
		expect(trinoTypeToPermitType('boolean')).toBe('bool');
		expect(trinoTypeToPermitType('json')).toBe('json');
		expect(trinoTypeToPermitType('timestamp')).toBe('time');
		expect(trinoTypeToPermitType('array')).toBe('array');
		expect(trinoTypeToPermitType('row')).toBe('object');
	});
});

describe('mapTrinoSchemaToPermitResources', () => {
	it('maps a simple Trino schema to Permit resources', () => {
		const schema: TrinoSchemaData = {
			catalogs: [{ name: 'testcat' }],
			schemas: [{ catalog: 'testcat', name: 'public' }],
			tables: [
				{
					catalog: 'testcat',
					schema: 'public',
					name: 'users',
					type: 'BASE TABLE',
					columns: [
						{ name: 'id', type: 'integer', nullable: false },
						{ name: 'email', type: 'varchar', nullable: false },
						{ name: 'is_active', type: 'boolean', nullable: true },
					],
				},
			],
			functions: [],
			views: [],
			materializedViews: [],
			procedures: [],
		};
		const resources = mapTrinoSchemaToPermitResources(schema);

		// Check catalogs
		const catalog = resources.find(r => r.key === 'trino-catalog-testcat');
		expect(catalog).toBeDefined();
		expect(catalog?.name).toBe('testcat');
		expect(catalog?.actions).toContain('AccessCatalog');

		// Check schemas
		const schemaResource = resources.find(
			r => r.key === 'trino-schema-testcat-public',
		);
		expect(schemaResource).toBeDefined();
		expect(schemaResource?.name).toBe('testcat.public');
		expect(schemaResource?.actions).toContain('CreateSchema');

		// Check tables
		const table = resources.find(
			r => r.key === 'trino-table-testcat-public-users',
		);
		expect(table).toBeDefined();
		expect(table?.name).toBe('testcat.public.users');
		expect(table?.actions).toContain('CreateTable');
		expect(table?.attributes).toBeDefined();
		expect(table?.attributes?.id).toEqual({ type: 'number' });
		expect(table?.attributes?.email).toEqual({ type: 'string' });

		// Check columns
		const column = resources.find(
			r => r.key === 'trino-column-testcat-public-users-id',
		);
		expect(column).toBeDefined();
		expect(column?.name).toBe('testcat.public.users.id');
		expect(column?.actions).toContain('SelectFromColumns');
	});

	it('maps Trino functions, views, materialized views, and procedures to Permit resources', () => {
		const schema: TrinoSchemaData = {
			catalogs: [{ name: 'testcat' }],
			schemas: [{ catalog: 'testcat', name: 'public' }],
			tables: [],
			functions: [
				{
					catalog: 'testcat',
					schema: 'public',
					name: 'my_func',
					returnType: 'integer',
					argumentTypes: ['varchar', 'integer'],
				},
			],
			views: [
				{
					catalog: 'testcat',
					schema: 'public',
					name: 'my_view',
					columns: [
						{ name: 'col1', type: 'varchar', nullable: false },
						{ name: 'col2', type: 'integer', nullable: true },
					],
				},
			],
			materializedViews: [
				{
					catalog: 'testcat',
					schema: 'public',
					name: 'my_mview',
					columns: [{ name: 'total', type: 'decimal', nullable: false }],
				},
			],
			procedures: [
				{
					catalog: 'testcat',
					schema: 'public',
					name: 'my_proc',
					argumentTypes: ['varchar'],
				},
			],
		};

		const resources = mapTrinoSchemaToPermitResources(schema);

		// Check function
		const func = resources.find(
			r => r.key === 'trino-function-testcat-public-my_func',
		);
		expect(func).toBeDefined();
		expect(func?.name).toBe('testcat.public.my_func');
		expect(func?.actions).toContain('ExecuteFunction');
		expect(func?.actions).toContain('ShowFunctions');
		expect(func?.attributes?.returnType).toEqual({ type: 'number' });
		expect(func?.attributes?.argumentTypes).toEqual({ type: 'array' });

		// Check view
		const view = resources.find(
			r => r.key === 'trino-view-testcat-public-my_view',
		);
		expect(view).toBeDefined();
		expect(view?.name).toBe('testcat.public.my_view');
		expect(view?.actions).toContain('CreateView');
		expect(view?.actions).toContain('DropView');
		expect(view?.attributes?.col1).toEqual({ type: 'string' });
		expect(view?.attributes?.col2).toEqual({
			type: 'number',
			description: 'nullable',
		});

		// Check materialized view
		const mview = resources.find(
			r => r.key === 'trino-materialized_view-testcat-public-my_mview',
		);
		expect(mview).toBeDefined();
		expect(mview?.name).toBe('testcat.public.my_mview');
		expect(mview?.actions).toContain('CreateMaterializedView');
		expect(mview?.actions).toContain('RefreshMaterializedView');
		expect(mview?.attributes?.total).toEqual({ type: 'number' });

		// Check procedure
		const proc = resources.find(
			r => r.key === 'trino-procedure-testcat-public-my_proc',
		);
		expect(proc).toBeDefined();
		expect(proc?.name).toBe('testcat.public.my_proc');
		expect(proc?.actions).toContain('ExecuteProcedure');
		expect(proc?.attributes?.argumentTypes).toEqual({ type: 'array' });
	});
});
