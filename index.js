import logging from '@google-cloud/logging'

export default ({service, ...auth}) => {
   if (process.env.NODE_ENV != 'production') {
      console.log("No logs will be persisted to StackDriver while NODE_ENV != production")
   }

   const StackDriverLogger = logging({
      projectId: "yumo-1384",
      ...auth || {}
   }).log(service)

   const log = level => {
      let batchedEntries = []
      let lastCall = null

      return (message, payload) => {
         if (process.env.NODE_ENV == 'production') {
            const entry = StackDriverLogger.entry({
               resource: {
                  type: "gke_cluster",
                  labels: {
                     cluster_name: "yumo-infrastructure",
                     location: "europe-west1-d"
                  }
               },
               labels: {
                  service,
                  pod: process.env.HOSTNAME,
                  stage: process.env.STAGE
               }
            }, payload ? {message, payload} : message)

            batchedEntries.push(entry)
            console.log(message)

            const id = Math.random()
            lastCall = id

            setTimeout(() => {
               if (lastCall == id) {
                  const entries = batchedEntries
                  batchedEntries = []
                  StackDriverLogger[level](entries)
               }
            }, 50)
         } else {
            console.log(message)
         }
      }
   }

   const logger = log('info')
   logger.alert = log('alert')
   logger.critical = log('critical')
   logger.debug = log('debug')
   logger.error = log('error')
   logger.emergency = log('emergency')
   logger.info = log('info')
   logger.notice = log('notice')
   logger.warning = log('warning')
   logger.write = log('write')

   return logger
}