import React from 'react';
import { render } from 'ink-testing-library';
import APIToken from '../source/components/gitops/APIToken.js';
import SelectProject from '../source/components/gitops/SelectProject.js';
import PolicyName from '../source/components/gitops/PolicyName.js';
import delay from 'delay';
import { vi, describe, it, expect } from 'vitest';
import { getProjectList, getRepoList } from '../source/lib/gitops/utils.js';

vi.mock('../source/lib/gitops/utils.js', () => ({
	getProjectList: vi.fn(() =>
		Promise.resolve([
			{ id: 1, name: 'Project 1', key: 'proj1' },
			{ id: 2, name: 'Project 2', key: 'proj2' },
		]),
	),
  getRepoList: vi.fn(() =>
    Promise.resolve([
      { status: 'active', key: 'repo1' },
      { status: 'active', key: 'repo2' },
    ]),
  ),
}));
const enter = '\r';
const arrowUp = '\u001B[A';
const arrowDown = '\u001B[B';

describe('APIToken Component', () => {
	it('should call onApiKeySubmit with the correct value', async () => {
		const onApiKeySubmit = vi.fn();
		const onError = vi.fn();
		const { stdin, lastFrame } = render(
			<APIToken onApiKeySubmit={onApiKeySubmit} onError={onError} />,
		);
		const frameString = lastFrame()?.toString() ?? '';

		// Assertion
		expect(frameString).toMatch(/Enter Your API Key:/);

		const key = 'permit_key_'.concat('a'.repeat(97));

		await delay(50);
		stdin.write(key);
		await delay(50);
		stdin.write(enter);
		await delay(50);

		// Mock function assertions
		expect(onApiKeySubmit).toHaveBeenCalledOnce();
		expect(onApiKeySubmit).toHaveBeenCalledWith(key);
	});

	it('should call onError with "Invalid API Key" for incorrect value', async () => {
		const onApiKeySubmit = vi.fn();
		const onError = vi.fn();
		const { stdin, lastFrame } = render(
			<APIToken onApiKeySubmit={onApiKeySubmit} onError={onError} />,
		);
		const frameString = lastFrame()?.toString() ?? '';

		// Assertion
		expect(frameString).toMatch(/Enter Your API Key:/);

		const key = 'InvalidKey';

		await delay(50);
		stdin.write(key);
		await delay(50);
		stdin.write(enter);
		await delay(50);

		// Mock function assertions
		expect(onError).toHaveBeenCalledOnce();
		expect(onError).toHaveBeenCalledWith('Invalid API Key');
	});

	it('should call onError with "API Key is required" for empty value', async () => {
		const onApiKeySubmit = vi.fn();
		const onError = vi.fn();
		const { stdin, lastFrame } = render(
			<APIToken onApiKeySubmit={onApiKeySubmit} onError={onError} />,
		);
		const frameString = lastFrame()?.toString() ?? '';

		// Assertion
		expect(frameString).toMatch(/Enter Your API Key:/);

		const key = '';

		await delay(50);
		stdin.write(key);
		await delay(50);
		stdin.write(enter);
		await delay(50);

		// Mock function assertions
		expect(onError).toHaveBeenCalledOnce();
		expect(onError).toHaveBeenCalledWith('API Key is required');
	});
});

describe('Select Project Component', () => {
	it('should display loading message when projects are being loaded', async () => {
		const onProjectSubmit = vi.fn();
		const onError = vi.fn();
		const accessKey = 'permit_key_'.concat('a'.repeat(97));
		const { stdin, lastFrame } = render(
			<SelectProject
				accessToken={accessKey}
				onProjectSubmit={onProjectSubmit}
				onError={onError}
			/>,
		);

		// Assertion
		expect(lastFrame()?.toString() ?? '').toMatch(/Loading projects.../);
	});

	it('Should display project after loading', async () => {
		const onProjectSubmit = vi.fn();
		const onError = vi.fn();
		const accessKey = 'permit_key_'.concat('a'.repeat(97));
		const { stdin, lastFrame } = render(
			<SelectProject
				accessToken={accessKey}
				onProjectSubmit={onProjectSubmit}
				onError={onError}
			/>,
		);

		// Check that the loading message is displayed
		expect(lastFrame()?.toString() ?? '').toMatch(/Loading projects.../);

		// Wait for the mocked getProjectList to resolve and display the projects
		await delay(50); // Adjust time depending on the delay for fetching projects

		// Optionally: Check that the project names are displayed
		expect(lastFrame()?.toString()).toMatch(/Project 1/);
		expect(lastFrame()?.toString()).toMatch(/Project 2/);
		stdin.write(arrowDown);
		await delay(50);
		stdin.write(enter);
		await delay(50);
		expect(onProjectSubmit).toHaveBeenCalledOnce();
		expect(onProjectSubmit).toHaveBeenCalledWith('proj2');
	});
	it('should display an error message when fetching projects fails', async () => {
		const onProjectSubmit = vi.fn();
		const onError = vi.fn();
		const accessKey = 'permit_key_'.concat('a'.repeat(97));

		// Mock error response
		getProjectList.mockRejectedValueOnce(new Error('Failed to fetch projects'));

		const { stdin, lastFrame } = render(
			<SelectProject
				accessToken={accessKey}
				onProjectSubmit={onProjectSubmit}
				onError={onError}
			/>,
		);

		// Initially, check for loading message
		expect(lastFrame()?.toString()).toMatch(/Loading projects.../);

		// Wait for the error to be handled
		await delay(50); // Adjust delay as needed
		expect(onError).toHaveBeenCalledWith('Failed to fetch projects');
	});
});


describe("Policy Name Component", () => { 

  it("should call onPolicyNameSubmit with the correct value", async () => {
    const onPolicyNameSubmit = vi.fn();
    const onError = vi.fn();
    const projectName = 'project1';
    const accessToken = 'permit_key_'.concat('a'.repeat(97));
    const { stdin, lastFrame } = render(
      <PolicyName projectName={projectName} accessToken={accessToken} onPolicyNameSubmit={onPolicyNameSubmit} onError={onError} />
    );
    const frameString = lastFrame()?.toString() ?? '';
    expect(frameString).toMatch(/Enter Your Policy Name:/);
    const policyName = 'policy1';
    await delay(50);
    stdin.write(policyName);
    await delay(50);
    stdin.write(enter);
    await delay(50);

    expect(onPolicyNameSubmit).toHaveBeenCalledOnce();
    expect(onPolicyNameSubmit).toHaveBeenCalledWith(policyName);
  })
  it("should call onError with 'Policy Name is required' for empty value", async () => {
    const onPolicyNameSubmit = vi.fn();
    const onError = vi.fn();
    const projectName = 'project1';
    const accessToken = 'permit_key_'.concat('a'.repeat(97));
    const { stdin, lastFrame } = render(
      <PolicyName projectName={projectName} accessToken={accessToken} onPolicyNameSubmit={onPolicyNameSubmit} onError={onError} />
    );
    console.log("After rendering")
    const frameString = lastFrame()?.toString() ?? '';
    expect(frameString).toMatch(/Enter Your Policy Name:/);
    const policyName = '';
    await delay(50);
    stdin.write(policyName);
    await delay(50);
    stdin.write(enter);
    await delay(50);
    expect(onError).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith('Policy Name is required');
  })
  it("Invalid Policy Name  Error ", async () => {
    const onPolicyNameSubmit = vi.fn();
    const onError = vi.fn();
    const projectName = 'project1';
    const accessToken = 'permit_key_'.concat('a'.repeat(97));
    const { stdin, lastFrame } = render(
      <PolicyName projectName={projectName} accessToken={accessToken} onPolicyNameSubmit={onPolicyNameSubmit} onError={onError} />
    );
    const frameString = lastFrame()?.toString() ?? '';
    expect(frameString).toMatch(/Enter Your Policy Name:/);
    const policyName = 'Invalid Policy Name';
    await delay(50);
    stdin.write(policyName);
    await delay(50);
    stdin.write(enter);
    await delay(50);
    expect(onError).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith('Policy Name should contain only alphanumeric characters, hyphens and underscores');
  })
  it("Existing policy name", async () => {
    const onPolicyNameSubmit = vi.fn();
    const onError = vi.fn();
    const projectName = 'project1';
    const accessToken = 'permit_key_'.concat('a'.repeat(97));
    const { stdin, lastFrame } = render(
      <PolicyName projectName={projectName} accessToken={accessToken} onPolicyNameSubmit={onPolicyNameSubmit} onError={onError} />
    );
    const frameString = lastFrame()?.toString() ?? '';
    expect(frameString).toMatch(/Enter Your Policy Name:/);
    const policyName = 'repo1';
    await delay(50);
    stdin.write(policyName);
    await delay(50);
    stdin.write(enter);
    await delay(50);
    
    expect(onError).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith('Policy with this name already exists');
  });
  });