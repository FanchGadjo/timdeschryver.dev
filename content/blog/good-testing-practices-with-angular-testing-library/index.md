---
title: Good testing practices with 🦔 Angular Testing Library
slug: good-testing-practices-with-angular-testing-library
description: The Angular Testing Library provides utility functions to interact with Angular components, in the same way as a user would. This brings more maintainability to our tests, gives us more confidence that our component does what it's supposed to do, and it improves the accessibility which is better for our users. All these benefits, plus you'll see that it's fun to write tests in this way.
author: Tim Deschryver
date: 2019-10-03T13:00:00.000Z
tags: Angular, Testing, testing-library, angular-testing-library
banner: ./images/banner.jpg
bannerCredit: Photo by [Liudmyla Denysiuk](https://unsplash.com/@hedgehog90) on [Unsplash](https://unsplash.com)
published: true
---

[`Angular Testing Library`](https://testing-library.com/docs/angular-testing-library/intro) provides utility functions to interact with Angular components, in the same way as a user would. This brings more maintainability to our tests, gives us more confidence that our component does what it's supposed to do, and it improves the accessibility which is better for our users. All these benefits, plus you'll see that it's fun to write tests in this way.

## The `Angular Testing Library`

Angular Testing Library is a part of the [@testing-library](https://testing-library.com/) family with [🦑 DOM Testing Library](https://testing-library.com/docs/intro) in the center of the family.
We're encouraging good testing practices across multiple frameworks and libraries by bringing a similar API to the table.
These tests can be written in the test runner of your liking.

We encourage:

- **maintainable** tests: we do not want to test implementation details
- **confidence** in our components: you interact with your components the same way as your end-users
- **accessibility**: we want inclusive components

> The more your tests resemble the way your software is used, the more confidence they can give you.

## Getting Started

To get started, the first step is to install `@testing-library/angular`, after that we're good to go.

```bash
npm install --save-dev @testing-library/angular
```

In this post, we'll take an introduction by writing tests for a feedback form, starting very simple and keep building on top of it.

The form we'll put under test has a required name field, a required rating field that must be between 0 and 10, a summary field, and a select box to select a t-shirt size. A form wouldn't be a form without a submit button, so let's add that too.

The code of the forms looks as follows.

```ts
export class FeedbackComponent {
	@Input() shirtSizes: string[] = [];
	@Output() submitForm = new EventEmitter<Feedback>();

	form = this.formBuilder.group({
		name: ['', [Validators.required]],
		rating: ['', [Validators.required, Validators.min(0), Validators.max(10)]],
		description: [''],
		shirtSize: ['', [Validators.required]]
	});

	nameControl = this.form.get('name');
	ratingControl = this.form.get('rating');
	shirtSizeControl = this.form.get('shirtSize');

	constructor(private formBuilder: FormBuilder) {}

	submit() {
		if (this.form.valid) {
			this.submitForm.emit(this.form.value);
		}
	}
}
```

```html
<form [formGroup]="form" (ngSubmit)="submit()">
	<legend>Feedback form</legend>

	<mat-form-field>
		<mat-label>Name</mat-label>
		<input matInput type="text" formControlName="name" />
		<mat-error *ngIf="nameControl.hasError('required')"> Name is required </mat-error>
	</mat-form-field>

	<mat-form-field>
		<mat-label>Rating</mat-label>
		<input matInput type="number" formControlName="rating" />
		<mat-error *ngIf="ratingControl.hasError('required')"> Rating is required </mat-error>
		<mat-error *ngIf="ratingControl.hasError('min') || ratingControl.hasError('max')">
			Rating must be between 0 and 10
		</mat-error>
	</mat-form-field>

	<mat-form-field>
		<mat-label>Description</mat-label>
		<textarea matInput formControlName="description"></textarea>
	</mat-form-field>

	<mat-form-field>
		<mat-label>T-shirt size</mat-label>
		<mat-select placeholder="Select" formControlName="shirtSize">
			<mat-option *ngFor="let size of shirtSizes" [value]="size">{{ size }}</mat-option>
		</mat-select>
		<mat-error *ngIf="shirtSizeControl.hasError('required')"> T-shirt size is required </mat-error>
	</mat-form-field>

	<button type="submit" mat-stroked-button color="primary">Submit your feedback</button>
</form>
```

## Our first test

To be able to test the feedback component we must be able to render the component, we can do this by using the `render` function.
The `render` function takes the component under test as the first argument and has an optional second argument for more options see [`RenderOptions`](https://testing-library.com/docs/angular-testing-library/api#renderoptions), which we'll be covering soon.

```ts
import { render } from '@testing-library/angular';

it('should render the form', async () => {
	await render(FeedbackComponent);
});
```

> It doesn't have to be more than this as setup to test a simple component

In this case, it throws an exception because we're making use of reactive forms and some of the Angular Material components.
To solve this we must provide both of the missing modules. To provide these modules we use the `imports` property on the `RenderOptions`, similar to how `TestBed.configureTestingModule` works.

```ts
import { render } from '@testing-library/angular';

it('should render the form', async () => {
	await render(FeedbackComponent, {
		imports: [ReactiveFormsModule, MaterialModule]
	});
});
```

Now, this test works.

## Queries

The `render` function returns a [`RenderResult`](https://testing-library.com/docs/angular-testing-library/api#renderresult) object which contains utility functions to test the component.

You'll notice that we test components in a similar way just as an an end-user would do.
We don't test implementation details but `Angular Testing Library` gives us an API to test the component from the outside, via the component DOM nodes.

To verify the nodes an end-user sees we use [queries](https://testing-library.com/docs/dom-testing-library/api-queries), these are available on the rendered component.

> A query looks for the given text (as a `string` or `RegExp`) in the component, which is the first argument of the query. The optional second argument is [TextMatch](https://testing-library.com/docs/dom-testing-library/api-queries#textmatch).

In our test, to verify that the form is rendered with the correct title we can use the `getByText` query.
To use the query, we must import the `screen` object first.
You can think of `screen`, as the view that a end-user sees, it contains DOM of the page.

```ts
import { render, screen } from '@testing-library/angular';

it('should render the form', async () => {
	await render(FeedbackComponent, {
		imports: [ReactiveFormsModule, MaterialModule]
	});

	screen.getByText(/Feedback form/i);
});
```

In the above snippet, you don't see an assertion. This is because the `getBy` and `getAllBy` queries throw an error when the query isn't able to find the given text in the document. If we don't want Angular Testing Library to throw an error we can use the `queryBy` and `queryAllBy` queries instead, these queries return `null` if the element(s) can't be found.

For async code, it's also possible to wait for a moment until the element becomes visible or until a timeout occurs.
If you want to test async code, the queries you're looking for are `findByText` and `findAllByText`.
Before every check if the element is visible, Angular Testing Library will trigger a change detection cycle.

```ts
import { render, screen } from '@testing-library/angular';

it('should render the form', async () => {
	await render(FeedbackComponent, {
		imports: [ReactiveFormsModule, MaterialModule]
	});

	await screen.findByText(/Feedback form/i);
});
```

## Setting `@Input()` and `@Output()` properties

With the component rendered, the next step is to provide the needed `@Input()` and `@Output()` properties.
To assign these properties, we can use `componentProperties` from the `RenderOptions`.
In the case of the feedback component, we assign `shirtSizes` to a collection of t-shirt sizes and we assign `submitForm` to be a spy. Later on, we can use this spy to the verify the form submission.

```ts
import { render } from '@testing-library/angular';

it('form should display error messages and submit if valid', async () => {
	const submitSpy = jest.fn();
	await render(FeedbackComponent, {
		imports: [ReactiveFormsModule, MaterialModule],
		componentProperties: {
			shirtSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
			submitForm: {
				// because the output is an `EventEmitter` we must mock `emit`
				// the component uses `output.emit` to interact with the parent component
				emit: submitSpy
			} as any
		}
	});
});
```

Another way to do this, is to use the template syntax.
This wraps the component into a host component.

```ts
import { render } from '@testing-library/angular';

it('form should display error messages and submit if valid', async () => {
	const submitSpy = jest.fn();
	await render(
		'<feedback-form [shirtSizes]="shirtSizes" (submitForm)="submit($event)"></feedback-form>',
		{
			declarations: [FeedbackComponent],
			imports: [ReactiveFormsModule, MaterialModule],
			componentProperties: {
				shirtSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
				submit: submitSpy
			}
		}
	);
});
```

With this step, the component is ready to start writing tests.

## Events

So far we've seen how we can assert our rendered components with query functions, but we also need a way to interact with our components.
We can do this by [firing events](https://testing-library.com/docs/dom-testing-library/api-events).
Just like the query functions, these events are also available on the rendered component.

> For the full list of supported events you can take a look at the [source code](https://github.com/testing-library/dom-testing-library/blob/master/src/events.js). This post only covers the ones it needs to test the feedback component, but all of the events have a comparable API.

The first argument of an event is always the targeted DOM node, the optional second parameter is to provide extra information for the event. An example is which mouse button was pressed, or the text of an input event.

Good to know: an event will run a change detection cycle by calling `detectChanges()` after the event is fired.

### Clicking on elements

To click on an element, we use the `fireEvent.click` method.

```ts
import { render, screen, fireEvent } from '@testing-library/angular';

it('form should display error messages and submit if valid', async () => {
	const submitSpy = jest.fn();
	await render(
		'<feedback-form [shirtSizes]="shirtSizes" (submitForm)="submit($event)"></feedback-form>',
		{
			declarations: [FeedbackComponent],
			imports: [ReactiveFormsModule, MaterialModule],
			componentProperties: {
				shirtSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
				submit: submitSpy
			}
		}
	);

	const submit = screen.getByText(/Submit your feedback/i);

	fireEvent.click(submit);

	expect(submitSpy).not.toHaveBeenCalled();
});
```

Because we're able to click on the submit button now, we can also verify that the form has not been submitted because it's currently invalid.

We can use the second parameter (the options, which are the equivalent to the options of a JavaScript click) to fire a right click.

```ts
fireEvent.click(submit, { button: 2 });
```

### Filling in input fields

To make the form valid, we must be able to fill in the fields.
We can use this by using various events.

```ts
import { render, screen, fireEvent } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

it('form should display error messages and submit if valid', async () => {
	const submitSpy = jest.fn();
	await render(
		'<feedback-form [shirtSizes]="shirtSizes" (submitForm)="submit($event)"></feedback-form>',
		{
			declarations: [FeedbackComponent],
			imports: [ReactiveFormsModule, MaterialModule],
			componentProperties: {
				shirtSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
				submit: submitSpy
			}
		}
	);

	const name = screen.getByLabelText(/name/i);
	const rating = screen.getByLabelText(/rating/i);
	const description = screen.getByLabelText(/description/i);
	const shirtSize = screen.getByLabelText(/t-shirt size/i);
	const submit = screen.getByText(/submit your feedback/i);

	const inputValues = {
		name: 'Tim',
		rating: 7,
		description: 'I really like @testing-library ♥',
		shirtSize: 'M'
	};

	fireEvent.click(submit);
	expect(submitSpy).not.toHaveBeenCalled();

	// fill in the name field with the `input` event
	// the second argument sets the value of the target, similar to the JavaScript API
	fireEvent.input(name, {
		target: {
			value: inputValues.name
		}
	});

	// an easier way to accomplish the same result is to use the `type` event from userEvent
	userEvent.type(rating, inputValues.rating.toString());
	userEvent.type(description, inputValues.description);

	// to select a value from the select component, we first have to click on the selectbox before clicking on the select option
	userEvent.click(shirtSize);
	userEvent.click(screen.getByText('L'));

	// an easier way to select options is to use the `selectOptions` event
	userEvent.selectOptions(shirtSize, inputValues.shirtSize);

	userEvent.click(submit);
	// our form is valid, so now we can verify it has been called with the form value
	expect(submitSpy).toHaveBeenCalledWith(inputValues);
});
```

Just like before, we can get our form fields by using queries.
This time we get the form fields by their corresponding label, this has the benefit that we're creating accessible forms.

> The `getByLabelText` and `queryByLabelText` are also looking at `aria-labels` to find an element

In the above form example, we notice that there are two different API's to fill in the input field.
The first one is via the `input` method and the second one with the `type` method from [userEvent](https://testing-library.com/docs/ecosystem-user-event/).

The difference between both API's is that `input` just fires the [JavaScript `input` event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/input_event) to set the form value.

Whereas `type` (from `userEvent`) also replicates the same events an end-user would trigger while interacting with our form to fill in the form field. This means that the input field also receive other events like `keydown` and `keyup`. Besides that, that API from the `userEvent` methods is also easier to work with. Because of these two reasons, this is the preferred way to interact with the component in your tests.

### Invalid controls

So far we have a working feedback component, but how could we test the validation messages?
We already have seen how we can verify our rendered component with `queries` and we've also seen how we interact with the component by firing events, this means we got all the tools in our toolbelt to test invalid controls in the feedback form.

If we blank out an input field, we should see a validation message.
This looks as follows.

```ts
userEvent.type(name, '');
screen.getByText('Name is required');
expect(name.getAttribute('aria-invalid')).toBe('true');

userEvent.type(name, 'Bob');
expect(screen.queryByText('Name is required')).toBeNull();
expect(name.getAttribute('aria-invalid')).toBe('false');

userEvent.type(rating, 15);
screen.queryByText('Rating must be between 0 and 10');
expect(rating.getAttribute('aria-invalid')).toBe('true');

userEvent.type(rating, inputValues.rating);
expect(rating.getAttribute('aria-invalid')).toBe('false');
```

Because a query returns the DOM node, we can use the DOM node to verify the control is valid or invalid.

## Working with containers and components

The current test covers our feedback component, which is just a component.
For some scenarios this might be a good thing to do, but more often I'm of the opinion that these tests add no value.
What I like to do is to test container components. Because a container consists of one or more components, these components will also be tested during the test of the container. Otherwise you will usually end with the same test twice, and with a double of the maintaining work.

To keep it simple, we simply wrap the form component in a container. The container has a service injected to provide the t-shirt sizes, and the service also has a submit function.

```ts
@Component({
	selector: 'feedback-container',
	template: `
		<feedback-form
			[shirtSizes]="service.shirtSizes$ | async"
			(submitForm)="service.submit($event)"
		></feedback-form>
	`
})
export class FeedbackContainer {
	constructor(public service: FeedbackService) {}
}
```

In the test for the `FeedbackContainer`, we now have to declare `FeedbackComponent` and provide a stubbed version of `FeedbackService`.
To do this, we can use a similar API as `TestBed.configureTestingModule` and use the `declarations` and `providers` properties on the `RenderOptions`.

Besides the setup our test looks the same.
In the test below, I choose to write the test in a more compact way which I find to come in handy for bigger forms.

```ts
import { render, screen, fireEvent } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

it('form should display error messages and submit if valid (container)', async () => {
	const submitSpy = jest.fn();
	await render(FeedbackContainer, {
		declarations: [FeedbackComponent],
		imports: [ReactiveFormsModule, MaterialModule],
		providers: [
			{
				provide: FeedbackService,
				useValue: {
					shirtSizes$: of(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
					submit: submitSpy
				}
			}
		]
	});

	const submit = screen.getByText('Submit your feedback');
	const inputValues = [
		{ value: 'Tim', label: /name/i, name: 'name' },
		{ value: 7, label: /rating/i, name: 'rating' },
		{
			value: 'I really like @testing-library ♥',
			label: /description/i,
			name: 'description'
		},
		{ value: 'M', label: /T-shirt size/i, name: 'shirtSize' }
	];

	inputValues.forEach(({ value, label }) => {
		const control = screen.getByLabelText(label);
		if (control.tagName === 'MAT-SELECT') {
			userEvent.selectOptions(control, value.toString());
		} else {
			userEvent.type(control, value.toString());
		}
	});
	userEvent.click(submit);

	expect(submitSpy).toHaveBeenCalledWith(
		inputValues.reduce((form, { value, name }) => {
			form[name] = value;
			return form;
		}, {})
	);
});
```

## A couple of tips for writing tests

### For End to End testing with Cypress use `🐅 Cypress Testing Library`

Because it's part of `@testing-library`, you can use a similar API while using Cypress.
This library exports the same utility functions from `DOM Testing Library` as Cypress commands.

More info and examples can be found at [@testing-library/cypress](https://github.com/testing-library/cypress-testing-library).

### Use `@testing-library/jest-dom` to make assertions human readable

This is only applicable if you're using Jest as your test runner.
This library has useful utility Jest matchers, for example `toBeValid()`, `toBeVisible()`, `toHaveFormValues()`, and more.

More info and examples can be found at [@testing-library/jest-dom](https://github.com/testing-library/jest-dom).

### Prefer one test over multiple tests

As you have noticed in the snippets used in this article, they are all part of one single test.
This goes against a popular principle that you should only have one assert for a test.
I usually have one arrange and multiple acts and asserts in one test.

> "Think of a test case workflow for a manual tester and try to make each of your test cases include all parts to that workflow. This often results in multiple actions and assertions which is fine."

Read more about this practice can be found at [Write fewer, longer tests](https://kentcdodds.com/blog/write-fewer-longer-tests) by [Kent C. Dodds](https://twitter.com/kentcdodds).

### Don't use `beforeEach`

Using `beforeEach` might be useful for certain test cases, but in most cases, I prefer to use a simple `setup` function.
I find it more readable, plus it's more flexible if you want to use a different setup in various tests, for example:

```ts
it('should show the dashboard for an admin', () => {
	const { handleClick } = setup({ name: 'Tim', roles: ['admin'] });
});

it('should show the dashboard for an employee', () => {
	const { handleClick } = setup({ name: 'Alicia', roles: ['employee'] });
});

async function setup(user, handleClick = jest.fn()) {
	const component = await render(DashboardComponent, {
		componentProperties: {
			user,
			handleClick
		}
	});

	return {
		handleClick
	};
}
```

## Example code

The code from this article is available on [GitHub](https://github.com/timdeschryver/atl-good-testing-practices).

Once you know `queries` and how to fire events, you're all set to test your components.
The only difference between the test case in this post and other test cases lies on how to set up the component with the `render` function, you can find [more examples in the `Angular Testing Library` repository](https://github.com/testing-library/angular-testing-library/tree/master/apps/example-app/src/app/examples).

- [Single component](https://github.com/testing-library/angular-testing-library/tree/master/apps/example-app/src/app/examples/00-single-component.spec.ts)
- [Nested component](https://github.com/testing-library/angular-testing-library/tree/master/apps/example-app/src/app/examples/01-nested-component.spec.ts)
- [`@Input()` and `@Output()`](https://github.com/testing-library/angular-testing-library/tree/master/apps/example-app/src/app/examples/02-input-output.spec.ts)
- [Form](https://github.com/testing-library/angular-testing-library/tree/master/apps/example-app/src/app/examples/03-forms.spec.ts)
- [Form with Angular Material](https://github.com/testing-library/angular-testing-library/tree/master/apps/example-app/src/app/examples/04-forms-with-material.spec.ts)
- [Component with a provider](https://github.com/testing-library/angular-testing-library/tree/master/apps/example-app/src/app/examples/05-component-provider.spec.ts)
- [With NgRx](https://github.com/testing-library/angular-testing-library/tree/master/apps/example-app/src/app/examples/06-with-ngrx-store.spec.ts)
- [With NgRx `MockStore`](https://github.com/testing-library/angular-testing-library/tree/master/apps/example-app/src/app/examples/07-with-ngrx-mock-store.spec.ts)
- [Testing a directive](https://github.com/testing-library/angular-testing-library/tree/master/apps/example-app/src/app/examples/08-directive.spec.ts)
- [Router navigation](https://github.com/testing-library/angular-testing-library/tree/master/apps/example-app/src/app/examples/09-router.spec.ts)
- [Injection Token as a dependency](https://github.com/testing-library/angular-testing-library/tree/master/apps/example-app/src/app/examples/10-inject-token-dependency.spec.ts)
- [Create an issue if what you're looking for is not in this list](https://github.com/testing-library/angular-testing-library/issues/new)
