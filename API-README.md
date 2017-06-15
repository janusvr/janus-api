
### /screenshot/get
#### Parameters: `url, [key]`
#### Returns: 

JSON object with `success`, `data`, and `error` properties. If an error occured, `success` will be set to false, and `error` will contain an error message. If no errors occurred, `data` will be an array of matching screenshots for the requested room.

#### Example
```
GET /screenshot/get?url=http://test.com&key=thumbnail

{"success":true,"data":[{"url":"http://test.com","key":"thumbnail","value":"https://example.s3-us-west-2.amazonaws.com/test.png"}]}
```

### /room/search
#### Parameters: `keyword, [offset], [limit], [has_equi]`
