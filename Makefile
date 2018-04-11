all:
	@npm run babel

styles:
	@npm run styles

babel:
	@npm run babel

watch:
	@npm run watch

clean:
	@npm run clean

lint:
	@npm run lint

test:
	@npm test

.PHONY: all styles babel watch clean lint test
