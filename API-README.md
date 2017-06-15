
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
#### Parameters: `keyword, [offset=0], [limit=1], [has_equi]`
#### Returns:

JSON object with `success`, `data`, and `error` properties. If an error occured, `success` will be set to false, and `error` will contain an error message. If no errors occurred, `data` will be an array of rooms that contained `keyword` in the `meta_keywords`, `meta_description`, or `roomtitle` fields. `offset` and `limit` can be used for pagination. To only get rooms that have equi screenshots, pass `has_equi` with a value of `true`.

#### Example
```
GET /room/search?keyword=test&offset=0&limit=1


{"success":true, "data":[{"url":"http://paradox.spyduck.net/rooms/vape/index.html","roomtitle":"The VR Vape Bar | The World's First and Greatest Virtual Vape Bar","meta_description":"","meta_keywords":"","equi":"https://thumbnails-janusvr.s3-us-west-2.amazonaws.com/5c6dc233e35ee20485999b22ba246ab7/equi.jpg"}]}
```
