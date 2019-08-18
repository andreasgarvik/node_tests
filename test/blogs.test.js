const Page = require('./helpers/page')
Number.prototype._called = {}

let page

beforeEach(async () => {
	page = await Page.build()
	await page.goto('http://localhost:3000')
})

afterEach(async () => {
	await page.close()
})

describe('When logged in ', async () => {
	beforeEach(async () => {
		await page.login()
		await page.click('a.btn-floating')
	})

	test('See blog create form', async () => {
		const label = await page.getContent('form label')
		expect(label).toEqual('Blog Title')
	})

	describe('And using valid inputs', async () => {
		beforeEach(async () => {
			await page.type('.title input', 'My Title')
			await page.type('.content input', 'My Content')
			await page.click('form button')
		})

		test('Submitting to review screen', async () => {
			const header = await page.getContent('h5')

			expect(header).toEqual('Please confirm your entries')
		})

		test('Submitting blog to page', async () => {
			await page.click('button.green')
			await page.waitFor('.card')

			const title = await page.getContent('.card-title')
			const content = await page.getContent('p')

			expect(title).toEqual('My Title')
			expect(content).toEqual('My Content')
		})
	})

	describe('And using invalid inputs', async () => {
		beforeEach(async () => {
			await page.click('form button')
		})

		test('Shows error message', async () => {
			const title = await page.getContent('.title .red-text')
			const content = await page.getContent('.content .red-text')

			expect(title).toEqual('You must provide a value')
			expect(content).toEqual('You must provide a value')
		})
	})
})

describe('When not logged in', async () => {
	const actions = [
		{
			method: 'get',
			path: 'api/blogs'
		},
		{
			method: 'post',
			path: 'api/blogs',
			data: {
				title: 't',
				content: 'c'
			}
		}
	]

	test('Can not do anything with blogs', async () => {
		const results = await page.execReq(actions)

		for (let result of results) {
			expect(result).toEqual({ error: 'You must log in!' })
		}
	})
})
