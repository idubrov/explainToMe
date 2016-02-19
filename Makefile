

.PHONY: all

all : ../explainToMe.zip

../explainToMe.zip : manifest.json src/*.js src/*.css
	zip $@ $^
